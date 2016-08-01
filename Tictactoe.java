public class Tictactoe{
  int[][] field;
  public Tictactoe(){
    field = new int[3][3];
  }

  public int[][] getField(){
    return field;
  }

  public boolean set(int player, int x, int y){
    if(field[x][y] != 0){
      return false;
    }else{
      field[x][y] = player;
      return true;
    }
  }

  public int getWinner(){
    if(
      (field[0][0] == 1 && field[1][0] == 1 && field[2][0] == 1) ||
      (field[0][1] == 1 && field[1][1] == 1 && field[2][1] == 1) ||
      (field[0][2] == 1 && field[1][2] == 1 && field[2][2] == 1) ||
      (field[0][0] == 1 && field[0][1] == 1 && field[0][2] == 1) ||
      (field[1][0] == 1 && field[1][1] == 1 && field[0][2] == 1) ||
      (field[2][0] == 1 && field[2][1] == 1 && field[0][2] == 1) ||
      (field[0][0] == 1 && field[1][1] == 1 && field[2][2] == 1) ||
      (field[2][0] == 1 && field[1][1] == 1 && field[0][2] == 1)
    ){
      return 1;
    }else if(
      (field[0][0] == 2 && field[1][0] == 2 && field[2][0] == 2) ||
      (field[0][1] == 2 && field[1][1] == 2 && field[2][1] == 2) ||
      (field[0][2] == 2 && field[1][2] == 2 && field[2][2] == 2) ||
      (field[0][0] == 2 && field[0][1] == 2 && field[0][2] == 2) ||
      (field[1][0] == 2 && field[1][1] == 2 && field[0][2] == 2) ||
      (field[2][0] == 2 && field[2][1] == 2 && field[0][2] == 2) ||
      (field[0][0] == 2 && field[1][1] == 2 && field[2][2] == 2) ||
      (field[2][0] == 2 && field[1][1] == 2 && field[0][2] == 2)
    ){
      return 2;
    }else{
      return 0;
    }

  }

}
