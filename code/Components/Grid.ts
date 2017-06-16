export class Grid {
  size: number;
  x_offset: number;
  y_offset: number;
  spacing: number;

  constructor(size: number, x_offset: number, y_offset: number, spacing: number) {
    this.size = size;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.spacing = spacing;
  }

  getScreenCoordsFromGrid(x: number, y: number): { x: number, y: number } {
    return {
      x: this.x_offset + (x * (this.size + this.spacing)),
      y: this.y_offset + (y * (this.size + this.spacing))
    };
  }

  getGridCoordsFromFieldId(id: number) {
    if (id <= 10) {//Lowest row
      return { x: 10 - id, y: 10 };
    }
    else if (id <= 20) {//Right column
      return { x: 0, y: 10 - (id - 10) };
    }
    else if (id <= 30) {//Upper row
      return { x: id - 20, y: 0 };
    }
    else if (id <= 38) {//Left column
      return { x: 10, y: 1 + (id - 31) };
    }
    else if (id <= 46) {//Lower inner row
      return { x: 9 - (id - 39), y: 8 };
    }
    else if (id <= 52) {//Right inner column
      return { x: 2, y: 7 - (id - 47) };
    }
    else if (id <= 55) {//Upper inner row
      return { x: (id - 53) + 3, y: 2 };
    }
    else if (id <= 59) {//Center inner column
      return { x: 5, y: 2 + (id - 55) };
    }
    else if (id <= 62) {//Center inner row
      return { x: (id - 59) + 5, y: 6 };
    }
    else if (id <= 64) {//Center left column
      return { x: 8, y: 6 - (id - 62) };
    }
    else {
      throw `Field out of range: ${id}`;
    }
  }

}