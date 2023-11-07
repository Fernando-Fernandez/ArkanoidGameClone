window.onload = function () {
    const scoreDisplay = document.getElementById( 'score' );
    const gameContainer = document.getElementById( 'game-container' );
    const containerRect = gameContainer.getBoundingClientRect();
    let tiles_holder = document.getElementById('tiles-holder');
    let tileRectArray = [];
    const tilesPerRow = 20;
    const numberOfRows = 3;

    var ball = document.getElementById('ball');
    var racket = document.getElementById('racket');

    var restartButton = document.getElementById('restart');
    restartButton.addEventListener( 'click', function() {
        location.reload();
    } );

    let colors = [ 'red', 'green', 'blue', 'yellow', 'white', 'gray'
                , 'purple', 'orange', 'aqua' ];

    var leftBorder = 0;
    var rightBorder = gameContainer.offsetWidth - racket.offsetWidth;
    var speed = 5;

    let deltaX = 1;
    let deltaY = -1;
    let racketDeltaX = 0;

    let score = 0;

    function createTiles() {
        tileRectArray = [];
        tiles_holder.innerHTML = '';
        let tileWidth = containerRect.width / tilesPerRow;
        let tileHeight = 20;
        for( let j = 0; j < numberOfRows; j ++ ) {
            let tileTop = j * tileHeight;
            for( let i = 0; i < tilesPerRow; i ++ ) {
                let new_tile = document.createElement( 'div' );
                new_tile.className = 'tile';

                new_tile.style.left = ( tileWidth * i ) + 'px';
                new_tile.style.top = tileTop + 'px';

                let colorIndex = Math.trunc( Math.random() * colors.length );
                let color = colors[ colorIndex ];
                new_tile.style.backgroundColor = color;

                tiles_holder.appendChild( new_tile );
                tileRectArray.push( {
                    rect: new_tile.getBoundingClientRect()
                    , tile: new_tile
                    , falling: false
                } );
            }
        }
    };
  
    function restartGame() {
        let gameOver = document.getElementById( 'gameOver' );
        gameOver.style.display = 'none';
        ball.style.top = '45%';
        ball.style.left = '45%';
        racket.style.left = '40%';
        score = 0;
  
        document.addEventListener( 'keydown', function(e) {
            switch( e.key ) {
                case 'ArrowLeft':
                    racketDeltaX = -20;
                    break;
                case 'ArrowRight':
                    racketDeltaX = 20;
                    break;
            }
        } );

        createTiles();
        requestAnimationFrame( gameLoop );
    }
  

    let start;
    function gameLoop( timeStamp ) {
        if( start === undefined ) {
            start = timeStamp;
        }
        const elapsed = timeStamp - start;

        moveRacket();
        moveBall();

        scoreDisplay.innerText = score;

        requestAnimationFrame( gameLoop );
    }

    function moveRacket() {
        let racketPosition = parseInt( racket.style.left );
        racketPosition = Math.min( racketPosition + racketDeltaX, rightBorder );
        racketPosition = Math.max( racketPosition, leftBorder );
        racket.style.left = racketPosition + 'px';

        if( racketDeltaX > 0 ) {
            racketDeltaX --;
        } else if( racketDeltaX < 0 ) {
            racketDeltaX ++;
        }

    }

    function moveBall() {
        let ballRect = ball.getBoundingClientRect();

        let ballMiddleX = ( ballRect.left + ballRect.right ) / 2;

        let tileIndexesToDelete = [];

        // detect collision with tiles
        let tileCount = tileRectArray.length;
        for( let i = 0; i < tileCount; i++ ) {
            let tileStructure = tileRectArray[ i ];
            if( tileStructure.falling ) {
                continue;
            }
            let tileRect = tileStructure.rect;

            let middleHit = ( ballMiddleX > tileRect.left 
                            && ballMiddleX < tileRect.right );
            if( middleHit ) {
                // ball contact with tile bottom
                if( ballRect.top < tileRect.bottom 
                        && ballRect.bottom > tileRect.bottom ) {
                    deltaY = -deltaY;
                    tileIndexesToDelete.push( i );
                    break;
                }

                // ball contact with tile top
                if( ballRect.bottom > tileRect.top 
                        && ballRect.top < tileRect.top ) {
                    deltaY = -deltaY;
                    tileIndexesToDelete.push( i );
                    break;
                }
            }

            if( ballRect.top < tileRect.bottom ) {
                // ball contact with tile left
                if( ballRect.left < tileRect.left 
                        && ballRect.right > tileRect.left ) {
                    deltaX = -deltaX;
                    tileIndexesToDelete.push( i );
                    break;
                }

                // ball contact with tile right
                if( ballRect.left < tileRect.right 
                        && ballRect.right > tileRect.right ) {
                    deltaX = -deltaX;
                    tileIndexesToDelete.push( i );
                    break;
                }
            }
        }

        // remove falling tiles
        for( let j = tileIndexesToDelete.length - 1; j >= 0; j-- ) {
            score += 10;
            let i = tileIndexesToDelete[ j ];
            let tileStructure = tileRectArray[ i ];
            tileStructure.falling = true;
            makeItFall( tileStructure.tile );
            tileRectArray.splice( i, 1 );
        }

        // detect collision with top
        if( ballRect.top < containerRect.top ) {
            deltaY = -deltaY;
        }
        // detect collision with sides
        if( ballRect.left < containerRect.left 
                || ballRect.right > containerRect.right ) {
            deltaX = -deltaX;
        }
        // detect ball hitting the bottom or racket
        if( ballRect.bottom > containerRect.bottom ) {
            let racketRect = racket.getBoundingClientRect();
            if( ballRect.right >= racketRect.left
                    && ballRect.left <= racketRect.right ) {
                
                // TODO:  determine angle of the bounce
                let bouncePoint = ballMiddleX - racketRect.left;
                let racketPct = Math.abs( bouncePoint / racketRect.width );
                if( racketPct >= 0.4 && racketPct < 0.6 ) {
                    // lower angle of the bounce
                    let sign = Math.sign( deltaX );
                    deltaX = 0.5 * sign;
                } else 
                    if( racketPct >= 0.25 && racketPct < 0.75 ) {
                        // normalize angle of the bounce
                        let sign = Math.sign( deltaX );
                        deltaX = sign;
                    } else 
                        if( racketPct >= 0.1 && racketPct < 0.9 ) {
                            // increase angle of the bounce
                            let sign = Math.sign( deltaX );
                            deltaX = 1.5 * sign;
                        }
                
                deltaY = -deltaY;
            } else {
                gameOver();
                return;
            }
        }

        // move ball
        ball.style.left = ( ball.offsetLeft + deltaX * speed ) + 'px';
        ball.style.top = ( ball.offsetTop + deltaY * speed ) + 'px';
    }

    function makeItFall( aTile ) {
        // turn on CSS animation that makes tile fall and spin randomly
        aTile.style.animationName = 'falling';
        let turns = Math.random() * 7;
        aTile.style.setProperty( '--falling', turns + 'turn' );
  
        // once done falling, remove tile
        setTimeout( function() { 
            aTile.style.display = 'none';
            aTile.remove();
        }, 4000 );
    }

    function gameOver() {
        let gameOver = document.getElementById( 'gameOver' );
        gameOver.style.display = 'block';
        document.removeEventListener( 'keydown' );
    }
  
    restartGame();
};