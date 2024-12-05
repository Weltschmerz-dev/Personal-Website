from pprint import pprint

class Project:
    def __init__(self, id):
        self.visible = False
        self.big_box = False
        self.id = id

    def __repr__(self):
        return f"Project {self.id}: Visible: {self.visible} Big: {self.big_box}"

class Bar:
    def __init__(self, id):
        self.visible = False
        self.id = id

    def __repr__(self):
        return f"Bar {self.id}: Visible: {self.visible}"


test_1 = [
    Project(1), Bar(1), Project(2), Bar(2), Project(3), Bar(3), 
    Project(4), Bar(4), Project(5), Bar(5), Project(6), Bar(6)
]

def load_carousel():
    mid_point = int(len(test_1) / 2)
    if len(test_1) % 2 != 0:
        mid_point - 1

    test_1[mid_point].visible = True
    test_1[mid_point].big_box = True
    test_1[mid_point - 1].visible = True
    test_1[mid_point - 2].visible = True
    test_1[mid_point + 1].visible = True
    test_1[mid_point + 2].visible = True

def shift_right():
    mid_point = int(len(test_1) / 2)
    if len(test_1) % 2 != 0:
        mid_point - 1
    test_1[mid_point - 1].visible = False
    test_1[mid_point - 2].visible = False
    test_1[mid_point].big_box = False
    test_1.append(test_1.pop(0))
    test_1.append(test_1.pop(0))
    test_1[mid_point + 1].visible = True
    test_1[mid_point + 2].visible = True
    test_1[mid_point].big_box = True

def shift_left():
    mid_point = int(len(test_1) / 2)
    if len(test_1) % 2 != 0:
        mid_point - 1
    test_1[mid_point + 1].visible = False
    test_1[mid_point + 2].visible = False
    test_1[mid_point].big_box = False
    test_1.append(test_1.pop())
    test_1.append(test_1.pop())
    new_list = test_1[len(test_1) - 2:] + test_1[:len(test_1) - 2]
    new_list[mid_point - 1].visible = True
    new_list[mid_point - 2].visible = True
    new_list[mid_point].big_box = True
    return new_list

load_carousel()
pprint(test_1)
shift_right()
# pprint(test_1)
new_list = shift_left()
pprint(new_list)