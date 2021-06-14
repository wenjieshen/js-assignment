# An assignment: Path editing
## Primary feature: Please ref the below video
https://user-images.githubusercontent.com/9885145/121869092-42582b00-cd34-11eb-8c9e-f6271edc13ac.mov

## Architecture:
I apply state pattern to the project. The editor is like a finite state machine that controls which callbacks will delegate the mouse or keyboard event.
The primary data structure is a double-linked list storing points for keeping topologic of the path.
## Performance:
- Add : O(n) if a point adds to a path with n points
- Remove : O(n) if a point is removed to a path that remains n points
- Move points : O(nm) if n points move in a path with m points

Envirment is cloned from https://github.com/GuillaumeDesforges/pixijs-typescript-starter
