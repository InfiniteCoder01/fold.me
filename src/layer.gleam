import gleam/float
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/result
import gleam_community/maths
import paint.{type Vec2} as p

pub type Layer {
  Layer(points: List(Vec2), animation: List(Vec2), color: p.Colour)
  Stack(List(Layer))
  Fold(top: Layer, bottom: Layer, crease: #(Vec2, Vec2))
}

pub fn paper(points: List(Vec2), color: p.Colour) -> Layer {
  Layer(points, list.map(points, fn(_) { #(0.0, 0.0) }), color)
}

pub fn paper_rect(pos: Vec2, size: Vec2, color: p.Colour) -> Layer {
  paper(
    [
      #(pos.0 -. size.0 /. 2.0, pos.1 -. size.1 /. 2.0),
      #(pos.0 +. size.0 /. 2.0, pos.1 -. size.1 /. 2.0),
      #(pos.0 +. size.0 /. 2.0, pos.1 +. size.1 /. 2.0),
      #(pos.0 -. size.0 /. 2.0, pos.1 +. size.1 /. 2.0),
    ],
    color,
  )
}

pub fn default_stack(scale: Float) -> Layer {
  Stack([
    paper_rect(
      #(0.0, 0.0),
      #(300.0 *. scale, 500.0 *. scale),
      p.colour_hex("#bda583"),
    ),
    paper_rect(
      #(0.0, 0.0),
      #(300.0 *. scale, 500.0 *. scale),
      p.colour_hex("#cdba94"),
    ),
  ])
}

// -------------------------------------- Transforms
pub fn transform(
  layer: Layer,
  callback: fn(Vec2) -> Vec2,
  apply_to_animation: Bool,
) {
  case layer {
    Layer(points:, animation:, ..) ->
      Layer(
        ..layer,
        points: list.map(points, callback),
        animation: case apply_to_animation {
          True -> list.map(animation, callback)
          False -> animation
        },
      )
    Stack(layers) ->
      Stack(list.map(layers, transform(_, callback, apply_to_animation)))
    Fold(top:, bottom:, crease: #(p1, p2)) ->
      Fold(
        transform(top, callback, apply_to_animation),
        transform(bottom, callback, apply_to_animation),
        #(callback(p1), callback(p2)),
      )
  }
}

pub fn all_points(layer: Layer) -> List(Vec2) {
  case layer {
    Layer(points:, ..) -> points
    Stack(layers) -> list.flat_map(layers, all_points)
    Fold(top:, bottom:, ..) -> list.append(all_points(top), all_points(bottom))
  }
}

pub fn flip(layer: Layer, flip_line: #(Float, Float, Float)) -> Layer {
  let reflect = fn(point, line) -> Vec2 {
    let #(a, b, c) = line
    let #(x, y) = point
    let k = 2.0 *. { a *. x +. b *. y +. c } /. { a *. a +. b *. b }
    #(x -. a *. k, y -. b *. k)
  }

  case layer {
    Layer(points:, ..) ->
      Layer(..layer, points: list.map(points, reflect(_, flip_line)))
    Stack(layers) -> Stack(list.reverse(list.map(layers, flip(_, flip_line))))
    Fold(top:, bottom:, crease: #(p1, p2)) ->
      Fold(flip(bottom, flip_line), flip(top, flip_line), #(
        reflect(p1, flip_line),
        reflect(p2, flip_line),
      ))
  }
}

pub fn center(layer: Layer) -> Layer {
  let points = all_points(layer)
  let count = int.to_float(list.length(points))
  let center =
    list.fold(points, #(0.0, 0.0), fn(center, point) {
      #(center.0 +. point.0, center.1 +. point.1)
    })
  let center = #(center.0 /. count, center.1 /. count)
  transform(layer, fn(p) { #(p.0 -. center.0, p.1 -. center.1) }, False)
}

pub fn points(layer: Layer, midpoints: Bool) -> List(Vec2) {
  case layer {
    Layer(points:, ..) -> {
      case midpoints {
        True ->
          list.flatten(
            list.map_fold(
              points,
              result.lazy_unwrap(list.last(points), fn() { panic }),
              fn(last, point) {
                #(point, [
                  point,
                  #({ last.0 +. point.0 } /. 2.0, { last.1 +. point.1 } /. 2.0),
                ])
              },
            ).1,
          )
        False -> points
      }
    }
    Stack(layers) -> list.flatten(list.map(layers, points(_, midpoints)))
    Fold(top:, bottom:, ..) ->
      list.append(points(top, midpoints), points(bottom, midpoints))
  }
}

pub fn bottommost(layer: Layer) -> Layer {
  case layer {
    Stack([layer, ..]) -> bottommost(layer)
    Fold(_, layer, _) -> bottommost(layer)
    layer -> layer
  }
}

pub fn topmost(layer: Layer) -> Layer {
  case layer {
    Stack(layers) ->
      result.map(list.last(layers), topmost) |> result.unwrap(layer)
    Fold(layer, _, _) -> topmost(layer)
    layer -> layer
  }
}

pub fn align(layer: Layer, segments: Int) -> Layer {
  case points(bottommost(layer), False) {
    [p1, p2, ..] -> {
      let angle = maths.atan2(p2.1 -. p1.1, p2.0 -. p1.0)
      let angle_mod = 6.2831852 /. int.to_float(segments)
      let angle = result.unwrap(float.modulo(angle, angle_mod), angle)
      let angle = case angle_mod -. angle <. angle {
        True -> angle -. angle_mod
        False -> angle
      }

      let sin = maths.sin(0.0 -. angle)
      let cos = maths.cos(0.0 -. angle)

      transform(
        layer,
        fn(p) { #(p.0 *. cos -. p.1 *. sin, p.0 *. sin +. p.1 *. cos) },
        False,
      )
    }
    _ -> layer
  }
}

fn triangle_area(p1: Vec2, p2: Vec2, p3: Vec2) -> Float {
  // (1/2){x1(y2 − y3) + x2(y3 − y1) + x3(y1 − y2)}
  float.absolute_value(
    {
      p1.0
      *. { p2.1 -. p3.1 }
      +. p2.0
      *. { p3.1 -. p1.1 }
      +. p3.0
      *. { p1.1 -. p2.1 }
    }
    /. 2.0,
  )
}

pub fn area(layer: Layer) -> Float {
  case layer {
    Layer(points: [p1, p2, ..rest], ..) ->
      list.fold(rest, #(0.0, p1, p2), fn(state, p3) {
        let #(area, p1, p2) = state
        #(area +. triangle_area(p1, p2, p3), p2, p3)
      }).0
    Stack(layers) ->
      result.unwrap(list.max(list.map(layers, area), float.compare), 0.0)
    Fold(top:, bottom:, ..) -> float.max(area(top), area(bottom))
    _ -> 0.0
  }
}

// -------------------------------------- Interactive
pub fn update_animation(layer: Layer) -> Layer {
  case layer {
    Layer(points:, animation:, ..) ->
      Layer(
        ..layer,
        points: points,
        animation: list.map(list.zip(points, animation), fn(e) {
          let #(target, p) = e
          // p + (target - p) * 0.1
          #(
            p.0 +. { target.0 -. p.0 } *. 0.1,
            p.1 +. { target.1 -. p.1 } *. 0.1,
          )
        }),
      )
    Stack(layers) -> Stack(list.map(layers, update_animation))
    Fold(top:, bottom:, ..) ->
      Fold(
        ..layer,
        top: update_animation(top),
        bottom: update_animation(bottom),
      )
  }
}

pub fn draw_layer(layer: Layer) -> p.Picture {
  case layer {
    Layer(animation: [p1, p2, ..rest], color:, ..) ->
      p.path(
        p1,
        list.flatten([
          [p.path_line(p2)],
          list.map(rest, p.path_line),
          [p.path_line(p1), p.path_line(p2)],
        ]),
      )
      |> p.stroke(p.colour_hex("#292418"), 3.0)
      |> p.fill(color)
    Stack(layers) -> p.combine(list.map(layers, draw_layer))
    Fold(top:, bottom:, ..) -> p.concat(draw_layer(bottom), draw_layer(top))
    _ -> p.blank()
  }
}

pub fn match(a: Layer, b: Layer, scale: Float) -> Option(Float) {
  let combine = fn(scores) {
    option.map(option.all(scores), fn(scores) {
      let count = int.to_float(list.length(scores))
      list.fold(scores, 0.0, fn(a, b) { a +. b }) /. count
    })
  }
  case a, b {
    Layer(points: points1, color: color1, ..),
      Layer(points: points2, color: color2, ..)
      if color1 == color2
    -> {
      let points2 = list.map(points2, fn(p) { #(p.0 /. scale, p.1 /. scale) })
      let closest = fn(p: #(_, _), set) {
        result.unwrap(
          float.square_root(
            list.fold(set, 1_000_000.0, fn(dst, p2: #(_, _)) {
              let #(dx, dy) = #(p2.0 -. p.0, p2.1 -. p.1)
              float.min(dst, dx *. dx +. dy *. dy)
            }),
          ),
          0.0,
        )
      }

      let distances =
        list.append(
          list.map(points1, closest(_, points2)),
          list.map(points2, closest(_, points1)),
        )
      let count = int.to_float(list.length(distances))
      let score =
        list.fold(distances, 0.0, fn(score, dst) {
          score +. 1.0 -. dst *. dst /. 10_000.0
        })
        /. count
      case score >=. 0.2 {
        True -> Some(score)
        False -> None
      }
    }
    Stack(layers1), Stack(layers2) ->
      option.then(
        option.from_result(list.strict_zip(layers1, layers2)),
        fn(pairs) {
          combine(
            list.map(pairs, fn(pair: #(_, _)) { match(pair.0, pair.1, scale) }),
          )
        },
      )
    Fold(top: top1, bottom: bottom1, ..), Fold(top: top2, bottom: bottom2, ..)
    -> combine([match(top1, top2, scale), match(bottom1, bottom2, scale)])
    _, _ -> None
  }
}
