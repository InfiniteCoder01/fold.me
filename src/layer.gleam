import gleam/int
import gleam/list
import gleam_community/colour
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
      p.colour_hex("#C0BAA8"),
    ),
    paper_rect(
      #(0.0, 0.0),
      #(300.0 *. scale, 500.0 *. scale),
      p.colour_hex("#F1E9D2"),
    ),
  ])
}

// -------------------------------------- Transforms
pub fn transform(layer: Layer, callback: fn(Vec2) -> Vec2) {
  case layer {
    Layer(points:, ..) -> Layer(..layer, points: list.map(points, callback))
    Stack(layers) -> Stack(list.map(layers, transform(_, callback)))
    Fold(top:, bottom:, crease: #(p1, p2)) ->
      Fold(transform(top, callback), transform(bottom, callback), #(
        callback(p1),
        callback(p2),
      ))
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
  transform(layer, fn(p) { #(p.0 -. center.0, p.1 -. center.1) })
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
      |> p.stroke(colour.black, 3.0)
      |> p.fill(color)
    Stack(layers) -> p.combine(list.map(layers, draw_layer))
    Fold(top:, bottom:, ..) -> p.concat(draw_layer(bottom), draw_layer(top))
    _ -> p.blank()
  }
}
