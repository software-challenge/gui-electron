 describe('Replay', function(){
    var Replay;

    before((done)=>{
        requirejs(['bin/code/Replay'], function(r){
            Replay = r;
            done();
        });
    });

    describe('Board', function(){
        var testBoard;

        before((done)=>{
            loadXML('test/board.xml', board => {
                console.log(board);
                testBoard = new Replay.Board(board);
                done();
            });
        });

        it('should initialize', function(done){
            expect(testBoard).to.be.a('object');
            done();
        });

        it('should have loaded two tiles', function(done){
            expect(testBoard.tiles.length).to.be.equal(2);
            expect(testBoard.tileIndices[0]).to.be.equal(0);
            expect(testBoard.tileIndices[1]).to.be.equal(1);
            done();
        });

        it('should find tiles by index', function(done){
            expect(testBoard.getTileByIndex(1).index).to.be.equal(1);
            done();
        });

        it('should parse Strings to Directions correctly', function(done){
            //This is actually pretty hard to test, enums get compiled to numbers...
            expect(Replay.Board.StringToDirection('RIGHT'), Replay.Board.NumberToDirection(0));
            expect(Replay.Board.StringToDirection('UP_RIGHT'), Replay.Board.NumberToDirection(1));
            expect(Replay.Board.StringToDirection('UP_LEFT'), Replay.Board.NumberToDirection(2));
            expect(Replay.Board.StringToDirection('LEFT'), Replay.Board.NumberToDirection(3));
            expect(Replay.Board.StringToDirection('DOWN_LEFT'), Replay.Board.NumberToDirection(4));
            expect(Replay.Board.StringToDirection('DOWN_RIGHT'), Replay.Board.NumberToDirection(5));
            done();
        });

        it('should invert Directions correctly', function(done){
            expect(Replay.Board.InvertDirection(Replay.Board.StringToDirection('RIGHT')), Replay.Board.StringToDirection('LEFT'));
            expect(Replay.Board.InvertDirection(Replay.Board.StringToDirection('LEFT')), Replay.Board.StringToDirection('RIGHT'));
            expect(Replay.Board.InvertDirection(Replay.Board.StringToDirection('UP_RIGHT')), Replay.Board.StringToDirection('DOWN_LEFT'));
            expect(Replay.Board.InvertDirection(Replay.Board.StringToDirection('DOWN_RIGHT')), Replay.Board.StringToDirection('UP_LEFT'));
            expect(Replay.Board.InvertDirection(Replay.Board.StringToDirection('UP_LEFT')), Replay.Board.StringToDirection('DOWN_RIGHT'));
            expect(Replay.Board.InvertDirection(Replay.Board.StringToDirection('DOWN_LEFT')), Replay.Board.StringToDirection('UP_RIGHT'));
            done();
        });

        it('should rotate Directions correctly', function(done){
            //This is actually pretty hard to test, enums get compiled to numbers...
            expect(Replay.Board.RotateNumberDirectionBy(Replay.Board.StringToDirection('RIGHT'), 2), Replay.Board.StringToDirection('UP_LEFT'));
            expect(Replay.Board.RotateNumberDirectionBy(Replay.Board.StringToDirection('LEFT') ,1), Replay.Board.StringToDirection('DOWN_LEFT'));
            expect(Replay.Board.RotateNumberDirectionBy(Replay.Board.StringToDirection('UP_RIGHT'),-1), Replay.Board.StringToDirection('RIGHT'));
            expect(Replay.Board.RotateNumberDirectionBy(Replay.Board.StringToDirection('DOWN_RIGHT'),3), Replay.Board.StringToDirection('UP_RIGHT'));
            expect(Replay.Board.RotateNumberDirectionBy(Replay.Board.StringToDirection('UP_LEFT'),0), Replay.Board.StringToDirection('UP_LEFT'));
            expect(Replay.Board.RotateNumberDirectionBy(Replay.Board.StringToDirection('DOWN_LEFT'),-3), Replay.Board.StringToDirection('UP_LEFT'));
            done();
        });

    });
});