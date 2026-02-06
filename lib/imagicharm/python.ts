export const IMAGI_PY = `
import types
import sys
from dataclasses import dataclass

Color = tuple

R = (255, 0, 0)
G = (0, 255, 0)
B = (0, 0, 255)
A = (0, 255, 255)
Y = (255, 255, 0)
O = (255, 165, 0)
M = (255, 0, 255)
P = (148, 0, 211)
W = (255, 255, 255)
K = (0, 0, 0)
on = W
off = K

font_6x8 = (
    (
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
    ),
    (
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '      ',
        '  #   ',
        '      ',
    ),
    (
        ' # #  ',
        ' # #  ',
        ' # #  ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
    ),
    (
        ' # #  ',
        ' # #  ',
        '##### ',
        ' # #  ',
        '##### ',
        ' # #  ',
        ' # #  ',
        '      ',
    ),
    (
        '  #   ',
        ' #### ',
        '#     ',
        ' ###  ',
        '    # ',
        '####  ',
        '  #   ',
        '      ',
    ),
    (
        '##    ',
        '##  # ',
        '   #  ',
        '  #   ',
        ' #    ',
        '#  ## ',
        '   ## ',
        '      ',
    ),
    (
        ' ##   ',
        '#  #  ',
        '# #   ',
        ' #    ',
        '# # # ',
        '#  #  ',
        ' ## # ',
        '      ',
    ),
    (
        '  ##  ',
        '   #  ',
        '  #   ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
    ),
    (
        '   #  ',
        '  #   ',
        ' #    ',
        ' #    ',
        ' #    ',
        '  #   ',
        '   #  ',
        '      ',
    ),
    (
        ' #    ',
        '  #   ',
        '   #  ',
        '   #  ',
        '   #  ',
        '  #   ',
        ' #    ',
        '      ',
    ),
    (
        '      ',
        '  #   ',
        '# # # ',
        ' ###  ',
        '# # # ',
        '  #   ',
        '      ',
        '      ',
    ),
    (
        '      ',
        '  #   ',
        '  #   ',
        '##### ',
        '  #   ',
        '  #   ',
        '      ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '      ',
        '      ',
        '  ##  ',
        '   #  ',
        '  #   ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '      ',
        '##### ',
        '      ',
        '      ',
        '      ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
        '  ##  ',
        '  ##  ',
        '      ',
    ),
    (
        '      ',
        '    # ',
        '   #  ',
        '  #   ',
        ' #    ',
        '#     ',
        '      ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '#  ## ',
        '# # # ',
        '##  # ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        '  #   ',
        ' ##   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        ' ###  ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '    # ',
        '   #  ',
        '  #   ',
        ' #    ',
        '##### ',
        '      ',
    ),
    (
        '##### ',
        '   #  ',
        '  #   ',
        '   #  ',
        '    # ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        '   #  ',
        '  ##  ',
        ' # #  ',
        '#  #  ',
        '##### ',
        '   #  ',
        '   #  ',
        '      ',
    ),
    (
        '##### ',
        '#     ',
        '####  ',
        '    # ',
        '    # ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        '  ##  ',
        ' #    ',
        '#     ',
        '####  ',
        '#   # ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        '##### ',
        '    # ',
        '   #  ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '#   # ',
        ' ###  ',
        '#   # ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '#   # ',
        ' #### ',
        '    # ',
        '   #  ',
        ' ##   ',
        '      ',
    ),
    (
        '      ',
        '  ##  ',
        '  ##  ',
        '      ',
        '  ##  ',
        '  ##  ',
        '      ',
        '      ',
    ),
    (
        '      ',
        '  ##  ',
        '  ##  ',
        '      ',
        '  ##  ',
        '   #  ',
        '  #   ',
        '      ',
    ),
    (
        '    # ',
        '   #  ',
        '  #   ',
        ' #    ',
        '  #   ',
        '   #  ',
        '    # ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '##### ',
        '      ',
        '##### ',
        '      ',
        '      ',
        '      ',
    ),
    (
        '#     ',
        ' #    ',
        '  #   ',
        '   #  ',
        '  #   ',
        ' #    ',
        '#     ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '    # ',
        '   #  ',
        '  #   ',
        '      ',
        '  #   ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '# ### ',
        '# # # ',
        '# ### ',
        '#     ',
        ' #### ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '#   # ',
        '#   # ',
        '##### ',
        '#   # ',
        '#   # ',
        '      ',
    ),
    (
        '####  ',
        '#   # ',
        '#   # ',
        '####  ',
        '#   # ',
        '#   # ',
        '####  ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '#     ',
        '#     ',
        '#     ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        '###   ',
        '#  #  ',
        '#   # ',
        '#   # ',
        '#   # ',
        '#  #  ',
        '###   ',
        '      ',
    ),
    (
        '##### ',
        '#     ',
        '#     ',
        '####  ',
        '#     ',
        '#     ',
        '##### ',
        '      ',
    ),
    (
        '##### ',
        '#     ',
        '#     ',
        '####  ',
        '#     ',
        '#     ',
        '#     ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '#     ',
        '#     ',
        '# ### ',
        '#   # ',
        ' #### ',
        '      ',
    ),
    (
        '#   # ',
        '#   # ',
        '#   # ',
        '##### ',
        '#   # ',
        '#   # ',
        '#   # ',
        '      ',
    ),
    (
        ' ###  ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        ' ###  ',
        '      ',
    ),
    (
        '  ### ',
        '   #  ',
        '   #  ',
        '   #  ',
        '   #  ',
        '#  #  ',
        ' ##   ',
        '      ',
    ),
    (
        '#   # ',
        '#  #  ',
        '# #   ',
        '##    ',
        '# #   ',
        '#  #  ',
        '#   # ',
        '      ',
    ),
    (
        '#     ',
        '#     ',
        '#     ',
        '#     ',
        '#     ',
        '#     ',
        '##### ',
        '      ',
    ),
    (
        '#   # ',
        '## ## ',
        '# # # ',
        '# # # ',
        '#   # ',
        '#   # ',
        '#   # ',
        '      ',
    ),
    (
        '#   # ',
        '#   # ',
        '##  # ',
        '# # # ',
        '#  ## ',
        '#   # ',
        '#   # ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '#   # ',
        '#   # ',
        '#   # ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        '####  ',
        '#   # ',
        '#   # ',
        '####  ',
        '#     ',
        '#     ',
        '#     ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '#   # ',
        '#   # ',
        '# # # ',
        '#  #  ',
        ' ## # ',
        '      ',
    ),
    (
        '####  ',
        '#   # ',
        '#   # ',
        '####  ',
        '# #   ',
        '#  #  ',
        '#   # ',
        '      ',
    ),
    (
        ' ###  ',
        '#   # ',
        '#     ',
        ' ###  ',
        '    # ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        '##### ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '      ',
    ),
    (
        '#   # ',
        '#   # ',
        '#   # ',
        '#   # ',
        '#   # ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        '#   # ',
        '#   # ',
        '#   # ',
        '#   # ',
        '#   # ',
        ' # #  ',
        '  #   ',
        '      ',
    ),
    (
        '#   # ',
        '#   # ',
        '#   # ',
        '# # # ',
        '# # # ',
        '## ## ',
        '#   # ',
        '      ',
    ),
    (
        '#   # ',
        '#   # ',
        ' # #  ',
        '  #   ',
        ' # #  ',
        '#   # ',
        '#   # ',
        '      ',
    ),
    (
        '#   # ',
        '#   # ',
        '#   # ',
        ' ###  ',
        '  #   ',
        '  #   ',
        '  #   ',
        '      ',
    ),
    (
        '##### ',
        '    # ',
        '   #  ',
        '  #   ',
        ' #    ',
        '#     ',
        '##### ',
        '      ',
    ),
    (
        ' ###  ',
        ' #    ',
        ' #    ',
        ' #    ',
        ' #    ',
        ' #    ',
        ' ###  ',
        '      ',
    ),
    (
        '      ',
        '#     ',
        ' #    ',
        '  #   ',
        '   #  ',
        '    # ',
        '      ',
        '      ',
    ),
    (
        ' ###  ',
        '   #  ',
        '   #  ',
        '   #  ',
        '   #  ',
        '   #  ',
        ' ###  ',
        '      ',
    ),
    (
        '  #   ',
        ' # #  ',
        '#   # ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
        '######',
    ),
    (
        ' ##   ',
        ' #    ',
        '  #   ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
    ),
    (
        '      ',
        '      ',
        ' ###  ',
        '    # ',
        ' #### ',
        '#   # ',
        ' #### ',
        '      ',
    ),
    (
        '#     ',
        '#     ',
        '# ##  ',
        '##  # ',
        '#   # ',
        '#   # ',
        '####  ',
        '      ',
    ),
    (
        '      ',
        '      ',
        ' ###  ',
        '#     ',
        '#     ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        '    # ',
        '    # ',
        ' ## # ',
        '#  ## ',
        '#   # ',
        '#   # ',
        ' #### ',
        '      ',
    ),
    (
        '      ',
        '      ',
        ' ###  ',
        '#   # ',
        '##### ',
        '#     ',
        ' #### ',
        '      ',
    ),
    (
        '  ##  ',
        ' #  # ',
        ' #    ',
        '####  ',
        ' #    ',
        ' #    ',
        ' #    ',
        '      ',
    ),
    (
        '      ',
        '      ',
        ' #### ',
        '#   # ',
        ' #### ',
        '    # ',
        ' ###  ',
        '      ',
    ),
    (
        '#     ',
        '#     ',
        '# ##  ',
        '##  # ',
        '#   # ',
        '#   # ',
        '#   # ',
        '      ',
    ),
    (
        '  #   ',
        '      ',
        ' ##   ',
        '  #   ',
        '  #   ',
        '  #   ',
        ' ###  ',
        '      ',
    ),
    (
        '   #  ',
        '      ',
        '  ##  ',
        '   #  ',
        '   #  ',
        '#  #  ',
        ' ##   ',
        '      ',
    ),
    (
        '#     ',
        '#     ',
        '#   # ',
        '#  #  ',
        '# #   ',
        '## #  ',
        '#   # ',
        '      ',
    ),
    (
        ' ##   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        ' ###  ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '## #  ',
        '# # # ',
        '# # # ',
        '#   # ',
        '#   # ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '# ##  ',
        '##  # ',
        '#   # ',
        '#   # ',
        '#   # ',
        '      ',
    ),
    (
        '      ',
        '      ',
        ' ###  ',
        '#   # ',
        '#   # ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '####  ',
        '#   # ',
        '####  ',
        '#     ',
        '#     ',
        '      ',
    ),
    (
        '      ',
        '      ',
        ' #### ',
        '#   # ',
        ' #### ',
        '    # ',
        '    # ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '# ##  ',
        '##  # ',
        '#     ',
        '#     ',
        '#     ',
        '      ',
    ),
    (
        '      ',
        '      ',
        ' #### ',
        '#     ',
        ' ###  ',
        '    # ',
        '####  ',
        '      ',
    ),
    (
        ' #    ',
        ' #    ',
        '####  ',
        ' #    ',
        ' #    ',
        ' #  # ',
        '  ##  ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '#   # ',
        '#   # ',
        '#   # ',
        '#  ## ',
        ' ## # ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '#   # ',
        '#   # ',
        '#   # ',
        ' # #  ',
        '  #   ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '#   # ',
        '#   # ',
        '# # # ',
        '# # # ',
        ' # #  ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '#   # ',
        ' # #  ',
        '  #   ',
        ' # #  ',
        '#   # ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '#   # ',
        '#   # ',
        ' #### ',
        '    # ',
        '####  ',
        '      ',
    ),
    (
        '      ',
        '      ',
        '##### ',
        '   #  ',
        '  #   ',
        ' #    ',
        '##### ',
        '      ',
    ),
    (
        '   ## ',
        '  #   ',
        '  #   ',
        ' #    ',
        '  #   ',
        '  #   ',
        '   ## ',
        '      ',
    ),
    (
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '  #   ',
        '      ',
    ),
    (
        '##    ',
        '  #   ',
        '  #   ',
        '   #  ',
        '  #   ',
        '  #   ',
        '##    ',
        '      ',
    ),
    (
        ' ## # ',
        '# ##  ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
        '      ',
    ),
    (
        '  #   ',
        '      ',
        '  #   ',
        ' #    ',
        '#     ',
        '#   # ',
        ' ###  ',
        '      ',
    ),
)

class Matrix(list):
    def __init__(self, source=None):
        if source is None:
            row_iter = ([off for _ in range(8)] for _ in range(8))
        elif isinstance(source, list):
            row_iter = (list(row) for row in source)
        else:
            raise TypeError('Unknown source to build a Matrix from')
        super().__init__(row_iter)

    def background(self, color):
        for i in range(8):
            for j in range(8):
                self[i][j] = color

    def character(self, char, char_color=on, x_offset=1):
        if x_offset <= -8 or x_offset >= 8:
            return
        if len(char) > 1:
            char = char[0]
        if not char:
            char = ' '
        if char < ' ' or char > chr(127):
            char = chr(127)
        bitmap = font_6x8[ord(char) - 32]
        for i, row in enumerate(bitmap):
            for j, c in enumerate(row):
                if c != ' ':
                    x = x_offset + j
                    if 0 <= x < 8:
                        self[i][x] = char_color

@dataclass
class Frame:
    snapshot: Matrix
    duration: int

class Animation(list):
    min_duration = 25
    max_duration = 16777215
    default_instance = None

    def __init__(self, loop_count=0):
        super().__init__()
        self.loop_count = loop_count
        Animation.default_instance = self

    def clear(self):
        self.loop_count = 0
        del self[:]

    def add_frame(self, matrix, duration=500):
        if duration < self.min_duration:
            duration = self.min_duration
        if duration > self.max_duration:
            duration = self.max_duration
        snapshot = Matrix(matrix)
        self.append(Frame(snapshot, duration))

    def scrolling_text(self, matrix, text, text_color=on, back_color=off, duration=80, loop_count=0):
        self.loop_count = loop_count
        if not text:
            matrix.background(back_color)
            return
        text_len = len(text)
        for index in range(text_len):
            indices = index, (index + 1) % text_len, (index + 2) % text_len
            for offset in range(6):
                matrix.background(back_color)
                for c, i in enumerate(indices):
                    matrix.character(text[i], text_color, x_offset=6 * c - offset)
                self.add_frame(matrix, duration)

blink_rate = 0
outdoor_mode = True
m = Matrix()
Animation()

def clear():
    m.background(off)

def background(color):
    m.background(color)

def character(char, char_color=on, back_color=0):
    if back_color:
        if back_color == 0:
            back_color = off
        m.background(back_color)
    m.character(char, char_color)

def scrolling_text(text, text_color=on, back_color=off, duration=80, loop_count=0):
    Animation.default_instance.scrolling_text(m, text, text_color, back_color, duration, loop_count)

def render(animation=None, blink_rate=0, outdoor_mode=True, path=None, scale=8):
    import imagi_js
    if animation is None:
        animation = Animation.default_instance
    if animation is None:
        return
    if 0 < blink_rate < 4:
        duration = 500 // blink_rate
        animation.add_frame(m, duration)
        clear()
        animation.add_frame(m, duration)
    if not animation:
        animation.add_frame(m)
    frames = []
    for frame in animation:
        frames.append({ "snapshot": frame.snapshot, "duration": frame.duration })
    imagi_js.render(frames, animation.loop_count)

open_imagilib = types.ModuleType("open_imagilib")
open_imagilib.__path__ = []

colors_mod = types.ModuleType("open_imagilib.colors")
colors_mod.Color = Color
colors_mod.R = R
colors_mod.G = G
colors_mod.B = B
colors_mod.A = A
colors_mod.Y = Y
colors_mod.O = O
colors_mod.M = M
colors_mod.P = P
colors_mod.W = W
colors_mod.K = K
colors_mod.on = on
colors_mod.off = off

fonts_mod = types.ModuleType("open_imagilib.fonts")
fonts_mod.font_6x8 = font_6x8

matrix_mod = types.ModuleType("open_imagilib.matrix")
matrix_mod.Matrix = Matrix

animation_mod = types.ModuleType("open_imagilib.animation")
animation_mod.Frame = Frame
animation_mod.Animation = Animation

emulator_mod = types.ModuleType("open_imagilib.emulator")
emulator_mod.blink_rate = blink_rate
emulator_mod.outdoor_mode = outdoor_mode
emulator_mod.m = m
emulator_mod.Animation = Animation
emulator_mod.Matrix = Matrix
emulator_mod.Color = Color
emulator_mod.clear = clear
emulator_mod.background = background
emulator_mod.character = character
emulator_mod.scrolling_text = scrolling_text
emulator_mod.render = render
emulator_mod.R = R
emulator_mod.G = G
emulator_mod.B = B
emulator_mod.A = A
emulator_mod.Y = Y
emulator_mod.O = O
emulator_mod.M = M
emulator_mod.P = P
emulator_mod.W = W
emulator_mod.K = K
emulator_mod.on = on
emulator_mod.off = off

open_imagilib.colors = colors_mod
open_imagilib.fonts = fonts_mod
open_imagilib.matrix = matrix_mod
open_imagilib.animation = animation_mod
open_imagilib.emulator = emulator_mod

sys.modules["open_imagilib"] = open_imagilib
sys.modules["open_imagilib.colors"] = colors_mod
sys.modules["open_imagilib.fonts"] = fonts_mod
sys.modules["open_imagilib.matrix"] = matrix_mod
sys.modules["open_imagilib.animation"] = animation_mod
sys.modules["open_imagilib.emulator"] = emulator_mod

imagilib_mod = types.ModuleType("imagilib")
imagilib_mod.__dict__.update(emulator_mod.__dict__)
sys.modules["imagilib"] = imagilib_mod
`;
