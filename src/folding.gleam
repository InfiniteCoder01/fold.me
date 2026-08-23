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

pub type Layer =
  List(Vec2)

fn split(layer: Layer, fold_line: #(Float, Float, Float)) -> List(Layer) {
  let polys = list.chunk(layer, above_line(_, fold_line))
  let polys = case polys {
    [a, b, c] -> [b, list.append(c, a)]
    polys -> polys
  }
  case polys {
    [a] -> [a]
    [a, b] -> {
      let a1 = result.lazy_unwrap(list.first(a), fn() { panic })
      let a2 = result.lazy_unwrap(list.last(a), fn() { panic })
      let b1 = result.lazy_unwrap(list.first(b), fn() { panic })
      let b2 = result.lazy_unwrap(list.last(b), fn() { panic })
      let p1 = line_intersection(points2line(a1, b2), fold_line)
      let p2 = line_intersection(points2line(a2, b1), fold_line)
      [
        list.flatten([[p1], a, [p2]]),
        list.flatten([[p2], b, [p1]]),
      ]
    }
    _ -> panic as "folding concave shapes"
  }
}

fn triangle_area(p1: Vec2, p2: Vec2, p3: Vec2) {
  float.absolute_value(
    p1.0
    *. { p2.1 -. p3.1 }
    +. p2.0
    *. { p3.1 -. p1.1 }
    +. p3.0
    *. { p1.1 -. p2.1 },
  )
  /. 2.0
}

fn layer_area(layer: Layer) -> Float {
  list.index_fold(layer, #(0.0, #(0.0, 0.0), #(0.0, 0.0)), fn(state, p3, index) {
    let #(area, p1, p2) = state
    case index {
      0 | 1 -> #(area, p2, p3)
      _ -> {
        #(area +. triangle_area(p1, p2, p3), p2, p3)
      }
    }
  }).0
}

// --------------------------------
pub opaque type Paper {
  Paper(space: Bool, mouse: Vec2, line: Option(Vec2), layers: List(Layer))
}

pub fn init() -> Paper {
  Paper(space: False, mouse: #(0.0, 0.0), line: None, layers: [
    [
      #(100.0, 100.0),
      #(400.0, 100.0),
      #(400.0, 600.0),
      #(100.0, 600.0),
    ],
  ])
}

fn fold(
  layers: List(Layer),
  fold_line: #(Float, Float, Float),
  space: Bool,
) -> List(Layer) {
  let intuitive_order = fn(top, bottom) {
    let direction =
      list.fold(top, 0.0, fn(area, layer) { area +. layer_area(layer) })
      <. list.fold(bottom, 0.0, fn(area, layer) { area +. layer_area(layer) })

    case direction {
      True -> #(top, bottom)
      False -> #(bottom, top)
    }
  }

  let #(top, bottom, keep_going) =
    list.fold(layers, #([], [], True), fn(state, layer) {
      let #(ltop, lbottom, keep_going) = state
      case keep_going {
        True ->
          case split(layer, fold_line) {
            [top, bottom] if space -> {
              #([top, ..ltop], [bottom, ..lbottom], False)
            }
            layers -> {
              let #(ltop, lbottom) =
                list.fold(layers, #(ltop, lbottom), fn(state, layer) {
                  let #(ltop, lbottom) = state
                  let above = case layer {
                    [_, point, ..] -> above_line(point, fold_line)
                    _ -> False
                  }
                  case above {
                    True -> #([layer, ..ltop], lbottom)
                    False -> #(ltop, [layer, ..lbottom])
                  }
                })
              #(ltop, lbottom, True)
            }
          }
        False -> #(ltop, [layer, ..lbottom], False)
      }
    })

  let #(top, bottom) = case keep_going {
    True -> intuitive_order(top, bottom)
    False -> #(top, bottom)
  }

  list.append(
    list.map(top, list.map(_, reflect(_, fold_line))),
    list.reverse(bottom),
  )
}

pub fn update(state: Paper, event: event.Event) -> Paper {
  case event {
    event.KeyboardPressed(event.KeySpace) -> Paper(..state, space: True)
    event.KeyboardRelased(event.KeySpace) -> Paper(..state, space: False)
    event.MouseMoved(x, y) -> Paper(..state, mouse: #(x, y))
    event.MousePressed(event.MouseButtonLeft) ->
      Paper(..state, line: Some(state.mouse))
    event.MouseReleased(event.MouseButtonLeft) ->
      case state {
        Paper(space:, mouse:, line: Some(start), layers:) -> {
          let fold_line = points2line(start, mouse)
          Paper(..state, line: None, layers: fold(layers, fold_line, space))
        }
        state -> state
      }
    _ -> state
  }
}

fn draw_layer(layer: Layer) -> p.Picture {
  case layer {
    [p1, p2, ..rest] ->
      p.path(
        p1,
        list.flatten([
          [p.path_line(p2)],
          list.map(rest, p.path_line),
          [p.path_line(p1), p.path_line(p2)],
        ]),
      )
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
    p.combine(list.reverse(list.map(state.layers, draw_layer)))
      |> p.fill(p.colour_hex("#F1E9D2"))
      |> p.stroke(colour.black, 3.0),
    line,
  ])
}
