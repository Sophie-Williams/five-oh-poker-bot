var pokerEvaluator = require('poker-evaluator');
var _ = require('lodash');

var ShotCaller = function (pHand, oHand, deck, pCard) {
  this.pHands = pHand;
  this.oHands = oHand;
  this.deck = deck;
  this.pCard = pCard;
};

ShotCaller.prototype._isFirstWinner = function (aHand, bHand) {
  var aHandEval = pokerEvaluator.evalHand(aHand);
  var bHandEval = pokerEvaluator.evalHand(bHand);
  if (aHandEval.handtype > bHandEval.handtype) {
    return true;
  } else if (aHandEval.handtype < bHandEval.handtype) {
    return false;
  } else if (aHandEval.handRank > bHandEval.handRank) {
    return true;
  } else {
    return false;
  }
};

ShotCaller.prototype._simulateRounds = function (pHandOriginal, oHandOriginal, useCard) {
  var NUM_ROUNDS = 10000;
  var playerWin = 0;
  //todo push / pop seems shitty 
  if (useCard) {
    pHandOriginal.push(this.pCard);
  }
  for (var i = 0; i < NUM_ROUNDS; i++) {
    var pHand = pHandOriginal.slice(0);
    var oHand = oHandOriginal.slice(0);
    var deck = _.shuffle(this.deck.slice(0));
    while (pHand.length < 5) {
      pHand.push(deck.pop());
    }
    while(oHand.length < 5) {
      oHand.push(deck.pop());
    }

    if (this._isFirstWinner(pHand, oHand)) {
      playerWin += 1;
    }
  }
  if (useCard) {
    pHandOriginal.pop();
  }
  return Math.round( (playerWin / NUM_ROUNDS) * 100);
};

ShotCaller.prototype.callShot = function (verbose) {
  var matchups =  [];
  var matchupsWithCard = [];
  var max, maxPos;
  for (var i = 0; i < this.pHands.length; i++) {
    if (!this.pHands[i]) { break; }
    var withCard = this._simulateRounds(this.pHands[i], this.oHands[i], true);
    var noCard = this._simulateRounds(this.pHands[i], this.oHands[i]);
    var diff = withCard - noCard;
    if (verbose) {
      console.log(i , 'Player Hand: ', this.pHands[i], 'Opp Hand: ', this.oHands[i]);
      console.log('Player Card: ', this.pCard);
      console.log('With Card: ', withCard, '%');
      console.log('Without Card: ', noCard, '%');
      console.log('Difference: ', diff);
      console.log('--------------------------------------------------------------------\n');
    }
    if (diff > max || !max) {
      max = diff;
      maxPos = i;
    }
  }
  return maxPos;
};


/*
* Server Logic
*/
var express    = require('express');
var app        = express();
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;    // set our port

var router = express.Router();        

router.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});
router.post('/', function (req, res) {
  var model = req.body;
  console.log(req.body);
  var ai = new ShotCaller(
    model.playerHands,
    model.opponentHands,
    model.deck,
    model.playerCard
  );
  var move = ai.callShot(true);
  console.log(move);
  res.status(200).end();
});
// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.listen(port);
console.log('Magic happens on port ' + port);