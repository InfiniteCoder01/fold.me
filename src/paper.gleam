import folding
import gleam/float
import gleam/int
import gleam/list
import gleam/option.{type Option, None, Some}
import layer as l
import paint as p
import paint/canvas
import paint/event

type State {
  State(
    paper: folding.Paper,
    tasks: List(#(l.Layer, Float, Bool)),
    score: Float,
    animated_score: Float,
    reset_timer: Option(Float),
  )
}

fn init(_: canvas.Config) -> State {
  State(folding.init(), [], 0.0, 0.0, None)
}

fn update(state: State, event: event.Event) -> State {
  let State(paper:, tasks:, score:, animated_score:, reset_timer:) = state

  // Update animations & stuff
  let tasks =
    list.index_map(tasks, fn(task, index) {
      let #(task, y, reset) = task
      #(
        l.update_animation(task),
        y +. { int.to_float(index) -. y } *. 0.1,
        reset,
      )
    })

  let paper = folding.update(paper, event)
  let animated_score = animated_score +. { score -. animated_score } *. 0.1

  // Add new tasks
  let tasks = case list.is_empty(tasks) {
    True -> {
      let iterations = int.min(float.round(float.floor(score /. 500.0)) + 1, 4)
      let batch =
        list.reverse(
          list.scan(
            list.repeat(0, iterations),
            l.default_stack(0.25),
            fn(layer, _) { l.center(folding.randomize(layer)) },
          ),
        )
      list.append(
        list.index_map(batch, fn(layer, index) { #(layer, 0.0, index == 0) }),
        tasks,
      )
    }
    False -> tasks
  }

  // Check for task completion
  let ntasks = list.length(tasks)
  let #(tasks, score, reset) = case event, paper.layers {
    event.MouseReleased(event.MouseButtonLeft), [layer, ..] -> {
      let layer = l.align(l.center(layer), 1)
      list.fold_right(tasks, #([], score, True), fn(state, task) {
        let #(tasks, score, reset) = state
        case l.match(layer, l.align(task.0, 1), 0.25) {
          Some(accuracy) -> #(
            tasks,
            score +. accuracy *. 100.0,
            reset && task.2,
          )
          None -> #([task, ..tasks], score, reset)
        }
      })
    }
    _, _ -> #(tasks, score, False)
  }
  let reset = list.length(tasks) != ntasks && reset

  // If any task has been completed
  let time = folding.continuous_time()
  let reset_timer = case reset {
    True -> Some(time +. 0.3)
    False -> reset_timer
  }

  let #(paper, reset_timer) = case reset_timer {
    Some(reset_timer) if time >. reset_timer -> {
      #(folding.Paper(..paper, layers: [l.default_stack(1.0)]), None)
    }
    _ -> #(paper, reset_timer)
  }

  State(paper:, tasks:, score:, animated_score:, reset_timer:)
}

fn view(state: State) -> p.Picture {
  p.combine([
    folding.view(state.paper),
    p.text(int.to_string(float.round(state.animated_score)), 80)
      |> p.text_align(p.TextAlignCenter)
      |> p.text_baseline(p.TextBaselineTop)
      |> p.translate_xy(folding.canvas_width() /. 2.0, 10.0)
      |> p.fill(p.colour_hex("#AAAAAA")),
    ..list.map(state.tasks, fn(task) {
      let #(layer, index, _) = task
      l.draw_layer(layer)
      |> p.translate_xy(folding.canvas_width() -. 100.0, 150.0 *. index +. 75.0)
    })
  ])
}

pub fn main() {
  canvas.interact(init, update, view, "#mycanvas")
}
