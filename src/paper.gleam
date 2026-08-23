import folding
import paint as p
import paint/canvas
import paint/event

type State {
  State(paper: folding.Paper)
}

fn init(_: canvas.Config) -> State {
  State(folding.init())
}

fn update(state: State, event: event.Event) -> State {
  State(paper: folding.update(state.paper, event))
}

fn view(state: State) -> p.Picture {
  folding.view(state.paper)
}

pub fn main() {
  canvas.interact(init, update, view, "#mycanvas")
}
