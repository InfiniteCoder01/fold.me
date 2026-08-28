import gleam/float
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam_community/colour
import layer.{type Layer} as l
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

fn split(
  layer: Layer,
  fold_line: #(Float, Float, Float),
) -> #(Option(Layer), Option(Layer), Option(#(Vec2, Vec2))) {
  // Combines line segments along the fold_line
  let combine_lines = fn(crease1: Option(#(_, _)), crease2: Option(#(_, _))) {
    let eval = fn(p: #(_, _)) {
      fold_line.1 *. p.0 -. fold_line.0 *. p.1 +. fold_line.2
    }

    let crease1 = case crease1 {
      Some(#(p1, p2)) -> {
        case eval(p1) <. eval(p2) {
          True -> Some(#(p1, p2))
          False -> Some(#(p2, p1))
        }
      }
      None -> None
    }

    let crease2 = case crease2 {
      Some(#(p1, p2)) -> {
        case eval(p1) <. eval(p2) {
          True -> Some(#(p1, p2))
          False -> Some(#(p2, p1))
        }
      }
      None -> None
    }

    case crease1, crease2 {
      Some(crease1), Some(crease2) -> {
        Some(
          #(
            case eval(crease1.0) <. eval(crease2.0) {
              True -> crease1.0
              False -> crease2.0
            },
            case eval(crease1.1) >. eval(crease2.1) {
              True -> crease1.1
              False -> crease2.1
            },
          ),
        )
      }
      Some(crease), None -> Some(crease)
      None, Some(crease) -> Some(crease)
      None, None -> None
    }
  }

  case layer {
    l.Layer(points:, ..) -> {
      // Split the points into groups depending on above/below the line
      let polys = list.chunk(points, above_line(_, fold_line))
      let polys = case polys {
        [a, b, c] -> [b, list.append(c, a)]
        polys -> polys
      }

      // Make sure first group is above the line (ordering)
      let polys = case polys {
        [[p1, ..] as first, ..rest] ->
          case above_line(p1, fold_line) {
            True -> polys
            False -> list.append(rest, [first])
          }
        polys -> polys
      }

      case polys {
        // The whole layer was on one side of the line
        [[p1, ..]] ->
          case above_line(p1, fold_line) {
            True -> #(Some(layer), None, None)
            False -> #(None, Some(layer), None)
          }

        // Split!
        [a, b] -> {
          let a1 = result.lazy_unwrap(list.first(a), fn() { panic })
          let a2 = result.lazy_unwrap(list.last(a), fn() { panic })
          let b1 = result.lazy_unwrap(list.first(b), fn() { panic })
          let b2 = result.lazy_unwrap(list.last(b), fn() { panic })
          let p1 = line_intersection(points2line(a1, b2), fold_line)
          let p2 = line_intersection(points2line(a2, b1), fold_line)

          let reduce = fn(point: Vec2, anchor: Vec2) {
            let #(dx, dy) = #(anchor.0 -. point.0, anchor.1 -. point.1)
            let dst = dx *. dx +. dy *. dy
            case dst <. 3.0 *. 3.0 {
              True -> []
              False -> [point]
            }
          }

          let points_a = list.flatten([reduce(p1, a1), a, reduce(p2, a2)])
          let points_b = list.flatten([reduce(p2, b1), b, reduce(p1, b2)])
          #(
            Some(l.Layer(..layer, points: points_a, animation: points_a)),
            Some(l.Layer(..layer, points: points_b, animation: points_b)),
            Some(#(p1, p2)),
          )
        }
        _ -> panic
      }
    }

    l.Stack(layers) -> {
      let #(top, bottom, fold) =
        list.fold_right(layers, #([], [], None), fn(state, layer) {
          let #(ltop, lbottom, fold) = state
          let #(top, bottom, fold1) = split(layer, fold_line)
          let ltop = list.append(option.values([top]), ltop)
          let lbottom = list.append(option.values([bottom]), lbottom)
          #(ltop, lbottom, combine_lines(fold, fold1))
        })

      #(
        case top {
          [] -> None
          layers -> Some(l.Stack(layers))
        },
        case bottom {
          [] -> None
          layers -> Some(l.Stack(layers))
        },
        fold,
      )
    }

    l.Fold(top:, bottom:, crease:) -> {
      // Split both layers into top and bottom sections,
      // get the new crease line
      let #(top, bottom, new_crease) = {
        let #(top1, bottom1, crease1) = split(top, fold_line)
        let #(top2, bottom2, crease2) = split(bottom, fold_line)
        #(
          option.values([top1, top2]),
          option.values([bottom1, bottom2]),
          combine_lines(crease1, crease2),
        )
      }

      let intersection =
        line_intersection(points2line(crease.0, crease.1), fold_line)

      // Check how fold_line intersects with this fold's crease line
      // and compute crease line segments for new split layers
      let #(crease1, crease2) = case
        above_line(crease.0, fold_line),
        above_line(crease.1, fold_line)
      {
        True, True -> #(crease, option.unwrap(new_crease, crease))
        True, False -> #(#(crease.0, intersection), #(intersection, crease.1))
        False, True -> #(#(crease.1, intersection), #(intersection, crease.0))
        False, False -> #(option.unwrap(new_crease, crease), crease)
      }

      // Combine the layers
      let combine = fn(layers, crease) {
        case layers {
          [] -> None
          [layer] -> Some(layer)
          [top, bottom] -> Some(l.Fold(top, bottom, crease))
          _ -> panic
        }
      }

      #(combine(top, crease1), combine(bottom, crease2), new_crease)
    }
  }
}

pub fn fold(
  layer: Layer,
  fold_line: #(Float, Float, Float),
  callback: fn(Layer) -> Layer,
) -> #(Layer, Bool) {
  let split_fold = fn(layer) {
    let #(top, bottom, crease) = split(layer, fold_line)
    case top, bottom, crease {
      Some(top), Some(bottom), Some(crease) -> #(
        callback(l.Fold(l.flip(top, fold_line), bottom, crease)),
        True,
      )
      // Not calling callback here, but I DON'T KNOW WHAT TO DO ABOUT THAT
      Some(top), None, _ -> #(l.flip(top, fold_line), True)
      None, Some(bottom), _ -> #(bottom, False)
      _, _, _ -> #(layer, False)
    }
  }

  case layer {
    l.Fold(top:, bottom:, crease:) -> {
      // Check how fold_line intersects with this fold's crease line
      let fold_all =
        above_line(crease.0, fold_line) || above_line(crease.1, fold_line)

      case fold_all {
        True -> split_fold(layer)
        False -> {
          case fold(top, fold_line, callback) {
            #(top, True) -> #(l.Fold(top, bottom, crease), True)
            #(top, False) ->
              case
                fold(bottom, fold_line, fn(layer) {
                  case layer {
                    l.Fold(top: top1, bottom: bottom1, crease: crease1) -> {
                      callback(l.Fold(
                        top1,
                        l.Fold(top, bottom1, crease),
                        crease1,
                      ))
                    }
                    layer -> layer
                  }
                })
              {
                #(_, True) as result -> result
                _ -> #(layer, False)
              }
          }
        }
      }
    }
    layer -> split_fold(layer)
  }
}

@external(javascript, "./extras.mjs", "time")
fn time() -> Int

pub fn continuous_time() -> Float {
  int.to_float(time()) /. 1000.0
}

pub fn randomize(layer: Layer) -> Layer {
  let topmost = l.topmost(layer)
  let points = l.points(topmost, True)
  use point <-
    fn(callback) {
      result.unwrap(list.find_map(points |> list.shuffle, callback), layer)
    }

  let dirs = [
    #(1.0, 0.0),
    #(1.0, 1.0),
    #(0.0, 1.0),
    #(-1.0, 1.0),
    #(-1.0, 0.0),
    #(-1.0, -1.0),
    #(0.0, -1.0),
    #(1.0, -1.0),
  ]

  list.find_map(dirs, fn(dir) {
    let line = points2line(point, #(point.0 +. dir.0, point.1 +. dir.1))
    case split(topmost, line) {
      #(Some(l1), Some(l2), _) ->
        case float.min(l.area(l1), l.area(l2)) >. 5.0 {
          True -> Ok(fold(layer, line, fn(layer) { layer }).0)
          False -> Error(Nil)
        }
      _ -> Error(Nil)
    }
  })
}

// -------------------------------- Interactive
pub type Paper {
  Paper(shift: Bool, mouse: Vec2, line: Option(Vec2), layers: List(Layer))
}

pub fn init() -> Paper {
  Paper(shift: False, mouse: #(0.0, 0.0), line: None, layers: [
    l.default_stack(1.0),
  ])
}

pub fn snap(p0: Vec2, points: List(Vec2), backup: List(Vec2)) -> Vec2 {
  let dst = fn(a: Vec2, b: Vec2) {
    { b.0 -. a.0 } *. { b.0 -. a.0 } +. { b.1 -. a.1 } *. { b.1 -. a.1 }
  }

  let closest =
    list.max(points, fn(p1, p2) { float.compare(dst(p0, p2), dst(p0, p1)) })
  let closest_backup =
    list.max(backup, fn(p1, p2) { float.compare(dst(p0, p2), dst(p0, p1)) })

  result.unwrap(
    result.try(closest, fn(p1) {
      case dst(p0, p1) <. 12.0 *. 12.0 {
        True -> Ok(p1)
        False -> Error(Nil)
      }
    }),
    result.unwrap(closest_backup, p0),
  )
}

pub fn update(state: Paper, event: event.Event) -> Paper {
  case event, state {
    event.KeyboardPressed(event.KeyShift), _ -> Paper(..state, shift: True)
    event.KeyboardReleased(event.KeyShift), _ -> Paper(..state, shift: False)
    event.KeyboardPressed(event.KeyBackspace),
      Paper(layers: [_, previous, ..rest], ..)
    -> Paper(..state, layers: [previous, ..rest])
    event.KeyboardPressed(event.KeySpace), Paper(layers: [layer, ..rest], ..) ->
      Paper(..state, layers: [l.align(l.center(layer), 4), ..rest])
    event.MouseMoved(x, y), Paper(shift:, line:, layers: [layer, ..], ..) -> {
      let mouse = #(x -. canvas_width() /. 2.0, y -. canvas_height() /. 2.0)
      let mouse = case shift, line {
        True, Some(start) -> {
          let dirs = [
            #(1.0, 0.0),
            #(1.0, 1.0),
            #(0.0, 1.0),
            #(-1.0, 1.0),
          ]

          let line_snaps =
            list.map(dirs, fn(dir) {
              line_intersection(
                points2line(start, #(start.0 +. dir.0, start.1 +. dir.1)),
                points2line(mouse, #(mouse.0 -. dir.1, mouse.1 +. dir.0)),
              )
            })

          snap(mouse, l.points(layer, True), line_snaps)
        }
        _, _ -> mouse
      }
      Paper(..state, mouse:)
    }
    event.MousePressed(event.MouseButtonLeft),
      Paper(shift:, mouse:, layers: [layer, ..], ..)
    ->
      Paper(
        ..state,
        line: Some(case shift {
          True -> snap(mouse, l.points(layer, True), [])
          False -> mouse
        }),
      )
    event.MouseReleased(event.MouseButtonLeft),
      Paper(mouse:, line: Some(start), layers: [layer, ..rest], ..)
    -> {
      let fold_line = points2line(start, mouse)
      Paper(..state, line: None, layers: [
        fold(layer, fold_line, fn(layer) { layer }).0,
        layer,
        ..rest
      ])
    }
    event.Tick(_), Paper(layers: [layer, ..rest], ..) ->
      Paper(..state, layers: [l.update_animation(layer), ..rest])
    _, state -> state
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
    case state.layers {
      [layer, ..] -> l.draw_layer(layer)
      _ -> p.blank()
    },
    line,
  ])
  |> p.translate_xy(canvas_width() /. 2.0, canvas_height() /. 2.0)
}

@external(javascript, "./extras.mjs", "width")
pub fn canvas_width() -> Float

@external(javascript, "./extras.mjs", "height")
pub fn canvas_height() -> Float
