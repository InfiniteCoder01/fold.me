import gleam/float
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam_community/colour
import paint.{type Vec2} as p
import paint/event

fn points2line(a: Vec2, b: Vec2) -> #(Float, Float, Float) {
  #(b.1 -. a.1, a.0 -. b.0, b.0 *. a.1 -. a.0 *. b.1)
}

fn line_intersection(
  line1: #(Float, Float, Float),
  line2: #(Float, Float, Float),
) -> Vec2 {
  let #(a1, b1, c1) = line1
  let #(a2, b2, c2) = line2
  #(
    { b1 *. c2 -. b2 *. c1 } /. { a1 *. b2 -. a2 *. b1 },
    { c1 *. a2 -. c2 *. a1 } /. { a1 *. b2 -. a2 *. b1 },
  )
}

fn above_line(point: Vec2, line: #(Float, Float, Float)) -> Bool {
  let #(a, b, c) = line
  let #(x, y) = point

  a *. x +. b *. y +. c >=. 0.0
}

fn reflect(point: Vec2, line: #(Float, Float, Float)) -> Vec2 {
  let #(a, b, c) = line
  let #(x, y) = point
  let k = 2.0 *. { a *. x +. b *. y +. c } /. { a *. a +. b *. b }
  #(x -. a *. k, y -. b *. k)
}

pub type Layer {
  Layer(points: List(Vec2), folds: List(Bool))
  Fold(top: Layer, bottom: Layer, fold: #(Vec2, Vec2))
}

fn split(
  layer: Layer,
  fold_line: #(Float, Float, Float),
) -> #(Option(Layer), Option(Layer), Option(#(Vec2, Vec2))) {
  case layer {
    Layer(points:, folds:) -> {
      // Split the points into groups depending on above/below the line
      let polys =
        list.chunk(list.zip(points, folds), fn(e) { above_line(e.0, fold_line) })
      let polys = case polys {
        [a, b, c] -> [b, list.append(c, a)]
        polys -> polys
      }

      // Make sure first group is above the line (ordering)
      let polys = case polys {
        [[p1, ..] as first, ..rest] ->
          case above_line(p1.0, fold_line) {
            True -> polys
            False -> list.append(rest, [first])
          }
        polys -> polys
      }

      case polys {
        // The whole layer was on one side of the line
        [[#(p1, _), ..]] ->
          case above_line(p1, fold_line) {
            True -> #(Some(layer), None, None)
            False -> #(None, Some(layer), None)
          }

        // Split!
        [a, b] -> {
          let #(a, afolds) = list.unzip(a)
          let #(b, bfolds) = list.unzip(b)
          let a1 = result.lazy_unwrap(list.first(a), fn() { panic })
          let a2 = result.lazy_unwrap(list.last(a), fn() { panic })
          let b1 = result.lazy_unwrap(list.first(b), fn() { panic })
          let b2 = result.lazy_unwrap(list.last(b), fn() { panic })
          let p1 = line_intersection(points2line(a1, b2), fold_line)
          let p2 = line_intersection(points2line(a2, b1), fold_line)
          let afolds2 = result.lazy_unwrap(list.first(afolds), fn() { panic })
          let bfolds2 = result.lazy_unwrap(list.first(bfolds), fn() { panic })
          #(
            Some(Layer(
              points: list.flatten([[p1], a, [p2]]),
              folds: list.flatten([[True], afolds, [bfolds2]]),
            )),
            Some(Layer(
              points: list.flatten([[p2], b, [p1]]),
              folds: list.flatten([[True], bfolds, [afolds2]]),
            )),
            Some(#(p1, p2)),
          )
        }
        _ -> panic
      }
    }

    Fold(top:, bottom:, fold:) -> {
      let fold = case above_line(fold.0, fold_line) {
        True -> fold
        False -> #(fold.1, fold.0)
      }

      // Split both layers into top and bottom sections
      let #(ltop, lbottom, fold1) = {
        let #(top, bottom, fold1) = split(top, fold_line)
        #(option.values([top]), option.values([bottom]), fold1)
      }

      // Weather we only need to fold the top part of this fold
      // (the fold line of this fold is below fold_line)
      let partial_fold = !above_line(fold.0, fold_line) && !list.is_empty(ltop)

      let #(ltop, lbottom, fold1) = case partial_fold {
        True -> #(ltop, list.append(lbottom, [bottom]), fold1)
        False -> {
          let #(top, bottom, fold2) = split(bottom, fold_line)
          #(
            list.append(ltop, option.values([top])),
            list.append(lbottom, option.values([bottom])),
            // Find the biggest fold line segment
            case fold1, fold2 {
              Some(fold1), Some(fold2) -> {
                let eval = fn(p: #(_, _)) {
                  fold_line.1 *. p.0 -. fold_line.0 *. p.1 +. fold_line.2
                }
                Some(
                  #(
                    case eval(fold1.0) <. eval(fold2.0) {
                      True -> fold1.0
                      False -> fold2.0
                    },
                    case eval(fold1.1) >. eval(fold2.1) {
                      True -> fold1.1
                      False -> fold2.1
                    },
                  ),
                )
              }
              None, Some(fold) -> Some(fold)
              Some(fold), None -> Some(fold)
              None, None -> None
            },
          )
        }
      }

      // Intersection between fold_line and this fold
      let intersection =
        line_intersection(points2line(fold.0, fold.1), fold_line)

      #(
        case ltop {
          [] -> None
          [layer] -> Some(layer)
          [top, bottom] -> Some(Fold(top, bottom, #(fold.0, intersection)))
          _ -> panic
        },
        case lbottom {
          [] -> None
          [layer] -> Some(layer)
          [top, bottom] -> Some(Fold(top, bottom, #(intersection, fold.1)))
          _ -> panic
        },
        fold1,
      )
    }
  }
}

pub fn flip(layer: Layer, flip_line: #(Float, Float, Float)) -> Layer {
  case layer {
    Layer(points:, ..) ->
      Layer(..layer, points: list.map(points, reflect(_, flip_line)))
    Fold(top:, bottom:, fold: #(p1, p2)) ->
      Fold(flip(bottom, flip_line), flip(top, flip_line), #(
        reflect(p1, flip_line),
        reflect(p2, flip_line),
      ))
  }
}

pub fn fold(layer: Layer, fold_line: #(Float, Float, Float)) -> Layer {
  case echo split(layer, fold_line) {
    #(Some(top), Some(bottom), Some(flip1)) ->
      Fold(flip(top, fold_line), bottom, flip1)
    #(Some(top), None, _) -> flip(top, fold_line)
    #(None, Some(bottom), _) -> bottom
    _ -> panic
  }
}

// fn triangle_area(p1: Vec2, p2: Vec2, p3: Vec2) {
//   float.absolute_value(
//     p1.0
//     *. { p2.1 -. p3.1 }
//     +. p2.0
//     *. { p3.1 -. p1.1 }
//     +. p3.0
//     *. { p1.1 -. p2.1 },
//   )
//   /. 2.0
// }

// fn layer_area(layer: Layer) -> Float {
//   list.index_fold(
//     layer.points,
//     #(0.0, #(0.0, 0.0), #(0.0, 0.0)),
//     fn(state, p3, index) {
//       let #(area, p1, p2) = state
//       case index {
//         0 | 1 -> #(area, p2, p3)
//         _ -> {
//           #(area +. triangle_area(p1, p2, p3), p2, p3)
//         }
//       }
//     },
//   ).0
// }

// --------------------------------
pub opaque type Paper {
  Paper(space: Bool, mouse: Vec2, line: Option(Vec2), layers: Layer)
}

pub fn init() -> Paper {
  Paper(
    space: False,
    mouse: #(0.0, 0.0),
    line: None,
    layers: Layer(
      points: [
        #(500.0, 200.0),
        #(800.0, 200.0),
        #(800.0, 700.0),
        #(500.0, 700.0),
      ],
      folds: [False, False, False, False],
    ),
  )
}

// fn fold(
//   layers: List(Layer),
//   fold_line: #(Float, Float, Float),
//   space: Bool,
// ) -> List(Layer) {
//   let intuitive_order = fn(top, bottom) {
//     let direction =
//       list.fold(top, 0.0, fn(area, layer) { area +. layer_area(layer) })
//       <. list.fold(bottom, 0.0, fn(area, layer) { area +. layer_area(layer) })

//     case direction {
//       True -> #(top, bottom)
//       False -> #(bottom, top)
//     }
//   }

//   let #(top, bottom, keep_going) =
//     list.fold(layers, #([], [], True), fn(state, layer) {
//       let #(ltop, lbottom, keep_going) = state
//       case keep_going {
//         True ->
//           case fold(layer, fold_line) {
//             #(_, True) if space -> #(ltop, [layer, ..lbottom], False)
//             #([top, bottom], False) if space -> {
//               let #(ltop, lbottom) =
//                 intuitive_order([top, ..ltop], [bottom, ..lbottom])
//               #(ltop, lbottom, False)
//             }
//             #(layers, _) -> {
//               let #(ltop, lbottom) =
//                 list.fold(layers, #(ltop, lbottom), fn(state, layer) {
//                   let #(ltop, lbottom) = state
//                   let above = case layer.points {
//                     [_, point, ..] -> above_line(point, fold_line)
//                     _ -> False
//                   }
//                   case above {
//                     True -> #([layer, ..ltop], lbottom)
//                     False -> #(ltop, [layer, ..lbottom])
//                   }
//                 })
//               #(ltop, lbottom, True)
//             }
//           }
//         False -> #(ltop, [layer, ..lbottom], False)
//       }
//     })

//   let #(top, bottom) = case keep_going {
//     True -> intuitive_order(top, bottom)
//     False -> #(top, bottom)
//   }

//   list.append(
//     list.map(top, fn(layer) {
//       Layer(..layer, points: list.map(layer.points, reflect(_, fold_line)))
//     }),
//     list.reverse(bottom),
//   )
// }

pub fn update(state: Paper, event: event.Event) -> Paper {
  case event {
    event.KeyboardPressed(event.KeySpace) -> Paper(..state, space: True)
    event.KeyboardRelased(event.KeySpace) -> Paper(..state, space: False)
    event.MouseMoved(x, y) -> Paper(..state, mouse: #(x, y))
    event.MousePressed(event.MouseButtonLeft) ->
      Paper(..state, line: Some(state.mouse))
    event.MouseReleased(event.MouseButtonLeft) ->
      case state {
        Paper(space: _, mouse:, line: Some(start), layers:) -> {
          let fold_line = points2line(start, mouse)
          Paper(..state, line: None, layers: fold(layers, fold_line))
        }
        state -> state
      }
    _ -> state
  }
}

fn draw_layer(layer: Layer) -> p.Picture {
  case layer {
    Layer(points: [p1, p2, ..rest], ..) ->
      p.path(
        p1,
        list.flatten([
          [p.path_line(p2)],
          list.map(rest, p.path_line),
          [p.path_line(p1), p.path_line(p2)],
        ]),
      )
      |> p.stroke(colour.black, 3.0)
      |> p.fill(p.colour_hex("#F1E9D2"))
    Fold(top:, bottom:, ..) -> p.concat(draw_layer(bottom), draw_layer(top))
    _ -> p.blank()
  }
}

pub fn view(state: Paper) -> p.Picture {
  let line = case state.line {
    Some(start) ->
      p.path(start, [p.path_line(state.mouse)])
      |> p.stroke_dashed(colour.dark_grey, 3.0, [5.0, 3.0])
    _ -> p.blank()
  }

  p.combine([
    draw_layer(state.layers),
    line,
  ])
}
