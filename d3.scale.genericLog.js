/*
  A log scale that can handle positive and negative values on the same graph.

  Not really an honest scale - it has a disconuity.
*/
d3.scale.genericLog = function() {
    return GenericLog();
};

function GenericLog() {
  
    var logScale = d3.scale.log();
    var linScale = d3.scale.linear();

    // Overall range/domain
    var domain = [-10, 10];
    var range = [0, 100];
    var zeroPoint = 50;

    // Constant
    var linearPartDistance = 10;

    linScale.domain([-linearPartDistance, +linearPartDistance]);

    function scale(x) {
        if (x >= linScale.domain()[1]) return zeroPoint + logScale(x);
        if (x <= linScale.domain()[0]) return zeroPoint - logScale(-x);
        return linScale(x);
    }

    scale.invert = function (y) {
      if (y > zeroPoint + 0.1) return 0 + logScale.invert(y - zeroPoint);
      if (y < zeroPoint - 0.1) return 0 - logScale.invert(zeroPoint - y);
      return linScale.invert(y);
    }

    // Returns what 0 in the domain maps onto in the range
    function recalculateZeroPoint() {
      // We can't just split proportionally because it's logorathmic
      // if we have [-20, 40] -> [10, 100]
      // then we want ticks like this:

      // 10   20   30   40   50   60   70   80   90   100
      // -20      -2       0        2        20       200
      //
      // i.e. we split the space proportionally to the logarithm of the lenghth
      var positiveLength = domain[1] - 0;
      var negativeLength = 0 - domain[0];
      var positiveProportion = Math.log(positiveLength)/(Math.log(negativeLength) + Math.log(positiveLength));
      var negativeProportion = 1 - positiveProportion;

      // Take the distance of the negative half into the domain
      zeroPoint = (negativeProportion * length(range)) + range[0];
    }

    function length(interval) {
      return interval[1] - interval[0];
    }

    scale.logScale = function () {
      return logScale;
    }

    scale.linScale = function () {
      return linScale;
    }

    // Domain will be e.g. [-5, 10]
    // In this case we want the domain of the positiveScale to be 1 to 10
    scale.domain = function(x) {
        if (!arguments.length) return domain;

        var low = x[0];
        if (low > -linearPartDistance) low = -linearPartDistance;
        var high = x[1];
        if (high < +linearPartDistance) high = +linearPartDistance;

        domain = x; recalculateZeroPoint();

        positiveLength = high - linearPartDistance;
        negativeLength = linearPartDistance - low;

        logScale.domain([linearPartDistance, Math.max(positiveLength, negativeLength)]);

        return scale;
    };

    function calculateLogScaleRange(overallRange) {
      var positiveLength = overallRange[1] - zeroPoint;
      var negativeLength = zeroPoint - overallRange[0];
      return [0, Math.max(negativeLength, positiveLength) - linearPartDistance];
    }

    function filterTicks(ticks, takeEvery) {
      return _.filter(ticks, function (x, index) { return (index % takeEvery) == takeEvery - 1; });
    }

    // Domain will be e.g. [50, 200]
    // e.g. neg log scale: [1, 5] => [50, 100]
    //      pos log scale: [1, 10] => [100, 200]
    scale.rangeRound = function(x) {
        if (!arguments.length) return range;
        range = x;

        recalculateZeroPoint();

        logScale.rangeRound(calculateLogScaleRange(x));
        linScale.rangeRound([zeroPoint - logScale(linearPartDistance), zeroPoint + logScale(linearPartDistance)]);

        return scale;
    };

    scale.range = function(x) {
        if (!arguments.length) return range;
        range = x;

        recalculateZeroPoint();

        logScale.range(calculateLogScaleRange(x));
        linScale.range([zeroPoint - logScale(linearPartDistance), zeroPoint + logScale(linearPartDistance)]);

        return scale;
    };

    scale.ticks = function(m) {
      var logScaleTicks = _.filter(logScale.ticks(m), function (x) { return x > linearPartDistance; });
      var negativeTicks = _.map(
          _.filter(logScaleTicks, function(x) { return x <= domain[0] * -1; }),
          function(x) { return -x; }
        );
      var positiveTicks = _.filter(logScaleTicks, function(x) { return x <= domain[1]; });
      return filterTicks(negativeTicks, 9).reverse()
        .concat([0])
        .concat(filterTicks(positiveTicks, 9));
    };

    scale.copyProperties = function (otherLogScale, r, d, z, linSc) {
      logScale = otherLogScale;
      range = r;
      domain = d;
      zeroPoint = z;
      linScale = linSc
      return scale;
    };

    scale.copy = function(o) {
      return GenericLog()
        .copyProperties(logScale, range, domain, zeroPoint, linScale);
    }
    return scale;
}