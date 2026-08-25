import folding
import gleam/int
import gleam/list
import layer as l
import paint as p
import paint/canvas
import paint/event

type State {
  State(paper: folding.Paper, tasks: List(l.Layer))
}

fn init(_: canvas.Config) -> State {
  State(folding.init(), [])
}

fn update(state: State, event: event.Event) -> State {
  let State(paper:, tasks:) = state
  let tasks = list.filter_map(tasks, fn(task) { Ok(l.update_animation(task)) })
  let tasks = case list.length(tasks) < 3 {
    True -> [folding.randomize(l.default_stack(0.25), 1), ..tasks]
    False -> tasks
  }
  State(paper: folding.update(paper, event), tasks:)
}

fn view(state: State) -> p.Picture {
  p.combine([
    folding.view(state.paper),
    ..list.index_map(state.tasks, fn(layer, index) {
      l.draw_layer(layer)
      |> p.translate_xy(
        folding.canvas_width() -. 100.0,
        150.0 *. int.to_float(index) +. 75.0,
      )
    })
  ])
}

pub fn main() {
  canvas.interact(init, update, view, "#mycanvas")
}
