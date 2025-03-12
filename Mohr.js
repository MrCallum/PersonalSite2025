let canvas;
let ctx;
const regenArtElement = document.querySelector('.regen-art');

// count and distribution settings
const circleCount = 100;
const squggleCount = 100; // 400
const overallBorder = () => Math.min(canvas.width * 0.2, canvas.height * 0.2);
const desiredTileDimension = 150;
const innerCellBorderPercent = 0.1;

// circle settings
const circle_LineWidth = 2;
// Random needs to be greater than this to be a solid circle.
const circle_solidChance = 0.65;
const circle_baseDimension = 5; 
const circle_randomAdditionalSize = () => Math.ceil(Math.random() * 15);

// Squiggle settings
const squiggle_maxSegmentCount = 6;
const squiggle_randomSegmentLength = () => Math.ceil((Math.random() * 3)) + 15;
const squiggle_normalLineWidth = 2;
// Random needs to be greater than this to be an abnormally thick line.
// I prefer the even look so it has been set to 1 so it is never reached.
const squiggle_abnormalWidthChance = 1; 
const squiggle_randomLineWidth = () => Math.floor(Math.random() * 5) + 2;

window.onload = function(){
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    ResizeCanvas();
}

window.addEventListener("resize", ResizeCanvas);

if (regenArtElement) {
    regenArtElement.addEventListener('click', Redraw);
}
  

function ResizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    Draw();
}

// A 1d array with two elements: an xDimension, yDimension.
let tileSize = [,];
// this will be an array of arrays where the inner array is [xPos, yPos, count]
let distributionGrid = [];

function MakeDistributionGrid(){
    
    // Tiles need to be inside of a border zone.
    // border is the same size in both x and y axis.
    const doubleBorder = overallBorder();
 
    // make the tile size approximately a size that you desire in both axis, then calculate how many rows and columns that will be.
    const approxTileSize = desiredTileDimension;
    const columnCount = Math.floor((canvas.width - doubleBorder) / approxTileSize);
    const rowCount = Math.floor((canvas.height - doubleBorder) / approxTileSize);


    // record the tile dimensions. We will need this later.
    tileSize[0] = (canvas.width - doubleBorder) / columnCount;
    tileSize[1] = (canvas.height - doubleBorder) / rowCount;

    // reset tile distribution
    distributionGrid = [];

    // set up the tile coords and distribution.
    // [ xCoord, yCoord, count (init as 0)]
    const halfBorder = doubleBorder / 2;
    for(let x = 0; x < columnCount; x++){
        for(let y = 0; y < rowCount; y++){
            distributionGrid.push([
                x * tileSize[0] + halfBorder, 
                y * tileSize[1] + halfBorder, 
                0
            ]);
        }
    }

    // eventually we want to "ask" the tile distribution to return a tile that has the fewest coords.
    // it will return just a single coord, eg [0,0].
}

function RandomiseDistributionGrid(){
    let currentIndex = distributionGrid.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [distributionGrid[currentIndex], distributionGrid[randomIndex]] = [
        distributionGrid[randomIndex], distributionGrid[currentIndex]];
    }
}

function DebugDrawDistributionGrid(){
    const lastFillStyle = ctx.fillStyle;

    const tinyGap = 2;
    const hueStep = 360 / distributionGrid.length;

    for(let i = 0; i < distributionGrid.length; i++){
        // colour is to show randomisation working.
        ctx.fillStyle = `hsl(${i * hueStep}, 100%, 50%)`;
        ctx.fillRect(distributionGrid[i][0], distributionGrid[i][1], tileSize[0] - tinyGap, tileSize[1] - tinyGap); 
    }

    ctx.fillStyle = lastFillStyle;
}

let currentHighest = 1;

function GetCellToPlaceElementAndRecord(){
    // returns the starting coordinate of a cell that should be less popualted than other cells.
    // Get the last element in the distribution grid, 
    // increment the "count" which is at index 3.

    let lastElement = distributionGrid.pop();
    lastElement[2]++; // increment the count
    if(lastElement[2] > currentHighest){
        // shuffle the distribution grid again.
        currentHighest++;
        RandomiseDistributionGrid();
    }
    distributionGrid.splice(0,0,lastElement);
    // return coord.
    return [lastElement[0], lastElement[1]];
}

function GetDistributedRandomCoord(dimensions = [0,0]){
    /* aim of this function is to return a semi-random starting coordinate to draw a shape at.
        It's "semi-random" because:
        1: We want the many hundereds of shapes to be distributed evenly over the canvas, hence why we use the "distributionGrid".
        2: Inside a single cell, if "dimensions" are supplied we will try to fit the shape entirely within the cell. 
    */

    // this returns just the top left "starting coord" of a cell.
    const cellCoords = GetCellToPlaceElementAndRecord();
    // work out where the border adjusted starting coord is.
    const innerCellBorder = [innerCellBorderPercent * tileSize[0], innerCellBorderPercent * tileSize[1]];
    cellCoords[0] += innerCellBorder[0];
    cellCoords[1] += innerCellBorder[1];

    const horizontalSpace = tileSize[0] - (2 * innerCellBorder[0]) - dimensions[0];
    const verticalSpace = tileSize[1] - (2 * innerCellBorder[1]) - dimensions[1];

    if(horizontalSpace < 0 || verticalSpace < 0){
        console.log("Warning! Shape was too big for cell");
        return cellCoords;
    } else {

        let xAddition = Math.ceil(Math.random() * horizontalSpace);
        let yAddition = Math.ceil(Math.random() * verticalSpace);
        return [cellCoords[0] + xAddition, cellCoords[1] + yAddition];
    }


}

function Draw(){
    // ctx.fillStyle = "rgb(255, 255, 255)";
    // DrawCheckerboard();
    MakeDistributionGrid();
    RandomiseDistributionGrid();
    ctx.fillStyle = "rgb(0, 0, 0)";
    DrawCircles(circleCount);
    DrawSquiggles(squggleCount)
}

function Redraw(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Draw();
}

function DrawCheckerboard(){
    let rows = Math.ceil(canvas.height / desiredTileDimension);
    let columns = Math.ceil(canvas.width / desiredTileDimension);
    // ctx.fillStyle = "rgb(200 0 0)";
    for (let i = 0; i <= rows; i++) {
        for (let j = 0; j <= columns; j++){
            if(i % 2 == j % 2){
                ctx.fillRect(desiredTileDimension * j, desiredTileDimension * i, desiredTileDimension, desiredTileDimension);
            }
        }
        
    }
}

/*
    Cells can be in a limited number of states
        1: off/empty
        2: snake occupied
        3: fruit occupied
    
    Snake navigation
        Easy at first. 
            Just go 

*/


function GetRandomCoordsInsideRange(itemSize){
    // 5% border that nothing should overlap
    const border = canvas.width * 0.05;

    let xRange = canvas.width - (2*border) - itemSize;
    let yRange = canvas.height - (2*border) - itemSize;
    let xPos = (Math.random() * xRange) + border;
    let yPos = (Math.random() * yRange) + border;
    return [xPos, yPos];

}

function DrawCircles(count){    
    ctx.lineWidth = circle_LineWidth;
    for (let index = 0; index < count; index++) {
        let isSolid = Math.random() > circle_solidChance;
        let dimension = circle_baseDimension;

        if(!isSolid) dimension += circle_randomAdditionalSize();

        // let [x, y] = GetRandomCoordsInsideRange(dimensions);
        let [x,y] = GetDistributedRandomCoord();

        ctx.beginPath();
        ctx.arc(x, y, dimension, 0, 2 * Math.PI);
        ctx.stroke();
        if(isSolid) ctx.fill();
    }
}

function DrawSquiggles(count){
    // a squiggle is a random number (between 1 and 6) of smaller 
    // lines (segments) connected end to end. 
    // Every segment changes angle to the previous one.
    // IE: No consequitive segments can have the same angle.
    // Angles are fixed to 45 degrees.
    // a squiggle can loop back and cross over itself though.

    for (let index = 0; index < count; index++) {
        // draw lines made up of 1 to 6 parts
        let segmentCount = Math.ceil(Math.random() * squiggle_maxSegmentCount);
        //segmentCount = 200;
        let path = GetPath(segmentCount);

        // we have our path directions
        // get path lengths
        
        let coords = ConvertPathIntoCoords(path);

        // calculate centre for better placement.
        let shapeDimensions = GetDimensionsOfShape(coords);
        //shapeCentre = [0,0];

        // get start coord
        // let [x,y] = GetRandomCoordsInsideRange(50);
        let [x,y] = GetDistributedRandomCoord(shapeDimensions);

        // draw
        // ctx.beginPath();
        // ctx.moveTo(x, y);
        // coords.forEach(c => {
        //     ctx.lineTo(c[0] + x, c[1] + y);
        // });
        // ctx.stroke();

        for(let i = 0; i < coords.length - 1; i++){
            if(Math.random() > squiggle_abnormalWidthChance){
                ctx.lineWidth = squiggle_randomLineWidth();
            } else {
                ctx.lineWidth = squiggle_normalLineWidth;
            }
            
            ctx.beginPath();
            ctx.moveTo(coords[i][0] + x + shapeDimensions[0], coords[i][1] + y + shapeDimensions[1]);
            ctx.lineTo(coords[i+1][0] + x+ shapeDimensions[0], coords[i+1][1] + y + shapeDimensions[1]);
            ctx.stroke();
        }
    }
}

function GetPath(length){
    /*
        Function returns an array of ints which it a set of directions to follow.
        Direction mapping:
            1 = North,  -1 = South
            2 = NE,     -2 = SW
            3 = E,      -3 = W
            4 = SE,     -4 = NW
        Rule 1: Can't go the same direction twice in a row.
             -> EG can't go North twice. 
             -> IE No two numbers may repeat.
        Rule 2: Cannot immediately reverse the last direction. 
             -> EG North cannot be followed by S. 
             -> EG 1 cannot be followed by neg 1.
             -> IE iff the two numbers added = 0 then there is a reverse.
    */

    let path = [];
    path.push(GetRandomDirection());

    while(path.length < length){
        let newDirection = GetRandomDirection(path[path.length - 1])
        path.push(newDirection);
    }
    return path;
}

function GetRandomDirection(lastDirection = 0){
    const directions = [1,2,3,4,-1,-2,-3,-4]
    let direction;

    while(direction == null || direction == lastDirection || lastDirection + direction == 0){
        direction = directions[Math.floor(Math.random() * directions.length)];
    }
    return direction;
}

function ConvertPathIntoCoords(path){
    let coords = [[0,0]];    
    
    for(let j = 0; j < path.length; j++){
        let segmentLength = squiggle_randomSegmentLength();
        let dir = path[j];

        // set new coord to old one, and then add to it.
        // slice is essential to create copy.
        let newCoord =  coords[coords.length  - 1 ].slice();
        
        if(dir == 1 || dir == -1){ // up or down
            newCoord[0] += segmentLength * dir;
        } else if(dir == 2 || dir == -2){ // left or right
            newCoord[1] += segmentLength * dir;
        } else {
            // segment length for hypotinuse = 1
            // So we convert segment length into the right length for purely x,y adjustment
            segmentLength =  Math.ceil(segmentLength * 0.7071 );

            // add or subtract x value.
            if(dir == 2 || dir == 4){
                newCoord[0] += segmentLength
            } else {
                newCoord[0]-= segmentLength
            }

            // add or subtract y value.
            if(dir == -4 || dir == 2){
                newCoord[1] += segmentLength
            } else {
                newCoord[1] -= segmentLength
            }
        }
        coords.push(newCoord);
    }

    return coords;
}

function GetDimensionsOfShape(coords){
    const xs = coords.map(c => c[0]);
    const ys = coords.map(c => c[1]);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    return [ maxX-minX, maxY-minY];
}

// Tests
function TestRandomDirectionEmpty(){
    let dist = {
        "-4" : 0,
        "-3" : 0,
        "-2" : 0,
        "-1" : 0,
        "0" : 0,
        "1" : 0,
        "2" : 0,
        "3" : 0,
        "4" : 0,
    }
    for(let i = 0; i < 1000; i++){
        let randomDir = GetRandomDirection();
        dist[randomDir] += 1;
    }

    console.log(dist);
}

function TestNextDirection(lastDir){
    let dist = {
        "-4" : 0,
        "-3" : 0,
        "-2" : 0,
        "-1" : 0,
        "0" : 0,
        "1" : 0,
        "2" : 0,
        "3" : 0,
        "4" : 0,
    }
    for(let i = 0; i < 1000; i++){
        let randomDir = GetRandomDirection(lastDir);
        dist[randomDir] += 1;
    }

    console.log(`Using ${lastDir} the distribution was this:`)
    console.log(dist);
}

function TestReallyLongPath(){
    let longPath = GetPath(1000);
    let fail = false;

    for(let i = 0; i < longPath.length; i++){
        if(longPath[i] == longPath[i+1]){
            console.warn(`Repeated the same direction!`);
            fail = true;
            continue;
        }
        if(longPath[i] + longPath[i+1] == 0){
            console.warn(`Went backwards!`);
            fail = true;
            continue;
        }
    }

    if(!fail){
        console.log("Really long path was fine.");
    }

}

