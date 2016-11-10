/* global GC */
// Statistics functions used to compute the growth curves
// Nikolai Schwertner, MedAppTech

// Initialize the GC global object as needed
window.GC = window.GC || {};

(function () {
    "use strict";

    // Normal Distribution Functions
    //    Math.normsdist:    (-inf,+inf) -> (0,1)          Z-score to percentile
    //    Math.normsinv:           (0,1) -> (-inf,+inf)    percentile to Z-score

    Math.normsinv = function (p) {
        // Lower tail quantile for standard normal distribution function.
        //
        // This function returns an approximation of the inverse cumulative
        // standard normal distribution function.  I.e., given P, it returns
        // an approximation to the X satisfying P = Pr{Z <= X} where Z is a
        // random variable from the standard normal distribution.
        //
        // The algorithm uses a minimax approximation by rational functions
        // and the result has a relative error whose absolute value is less
        // than 1.15e-9.
        //
        // Author:      Peter John Acklam
        // (Javascript version by Alankar Misra @ Digital Sutras (alankar@digitalsutras.com))
        // Time-stamp:  2003-05-05 05:15:14
        // E-mail:      pjacklam@online.no
        // WWW URL:     http://home.online.no/~pjacklam

        // An algorithm with a relative error less than 1.15*10-9 in the entire region.

        // Coefficients in rational approximations
        var a = [-3.969683028665376e+01,  2.209460984245205e+02,
                 -2.759285104469687e+02,  1.383577518672690e+02,
                 -3.066479806614716e+01,  2.506628277459239e+00];

        var b = [-5.447609879822406e+01,  1.615858368580409e+02,
                 -1.556989798598866e+02,  6.680131188771972e+01,
                 -1.328068155288572e+01 ];

        var c = [-7.784894002430293e-03, -3.223964580411365e-01,
                 -2.400758277161838e+00, -2.549732539343734e+00,
                 4.374664141464968e+00,  2.938163982698783e+00];

        var d = [7.784695709041462e-03,  3.224671290700398e-01,
                 2.445134137142996e+00,  3.754408661907416e+00];

        // Define break-points.
        var plow  = 0.02425;
        var phigh = 1 - plow;
        var q;

        // Rational approximation for lower region:
        if ( p < plow ) {
            q  = Math.sqrt(-2*Math.log(p));
            return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                        ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
        }

        // Rational approximation for upper region:
        if ( phigh < p ) {
            q  = Math.sqrt(-2*Math.log(1-p));
            return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
                        ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
        }

        // Rational approximation for central region:
        q = p - 0.5;
        var r = q*q;
        return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
                        (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    };

    Math.erf = function (x) {
        // Derived from http://www.codeproject.com/Articles/408214/Excel-Function-NORMSDIST-z

        // constants for A&S formula 7.1.26
        var a1 =  0.254829592,
            a2 = -0.284496736,
            a3 =  1.421413741,
            a4 = -1.453152027,
            a5 =  1.061405429,
            p  =  0.3275911;

        var sign = 1;
        if (x < 0)
            sign = -1;

        x = Math.abs(x);
        var t = 1.0/(1.0 + p*x);

        //Direct calculation using formula 7.1.26 is absolutely correct
        //But calculation of nth order polynomial takes O(n^2) operations
        //return 1 - (a1 * t + a2 * Math.pow(t,2) + a3 * Math.pow(t,3) + a4 * Math.pow(t,4) + a5 * Math.pow(t,5)) * Math.exp(-1 * x * x);

        //Horner's method, takes O(n) operations for nth order polynomial
        var y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t*Math.exp(-x*x);
        return sign*y;
    };

    Math.normsdist = function (z) {
        // Derived from http://www.codeproject.com/Articles/408214/Excel-Function-NORMSDIST-z
        return 0.5 * (1.0 + Math.erf(z/Math.sqrt(2)));
    };

    function mean (a,b,weight) {
        return b * weight + a * (1-weight);
    }

    var findLMSParameters = function (dataSet, gender, ageMonths) {

        var data = dataSet.data[gender],
            len = data.length,
            weight, i;

        ageMonths = GC.Util.floatVal(ageMonths);

        for (i = 0; i < len; i++) {
            if (ageMonths === data[i].Agemos) {
                // When we have an exact match, return it
                return {
                    L:   data[i].L,
                    M:   data[i].M,
                    S:   data[i].S
                };
            }
            else if (i < len-1 && ageMonths > data[i].Agemos && ageMonths <= data[i+1].Agemos) {
                // If we are inbetween data points, extrapolate LMS parameters
                weight = (ageMonths-data[i].Agemos) / (data[i+1].Agemos-data[i].Agemos);
                return {
                    L:   mean(data[i].L, data[i+1].L, weight),
                    M:   mean(data[i].M, data[i+1].M, weight),
                    S:   mean(data[i].S, data[i+1].S, weight)
                };
            }
        }

        return null;
    };

    /*
    // Adapted from: http://www.cdc.gov/growthcharts/percentile_data_files.htm
    // On 2012-11-28
    // By Nikolai Schwertner, MedAppTech

    From CDC:

    The LMS parameters are the median (M), the generalized coefficient of
    variation (S), and the power in the Box-Cox transformation (L). To
    obtain the value (X) of a given physical measurement at a
    particular z-score or percentile, use the following equation:

    X = M (1 + LSZ)**(1/L), L <> 0
    X = M exp(SZ), L = 0

    To obtain the z-score (Z) and corresponding percentile for a given
    measurement (X), use the following equation:


    Z = (((X/M)**L) - 1)/LS  , L<>0
    Z = ln(X/M)/S            , L=0
    */

    GC.findXFromZ = function(Z, dataSet, gender, ageMonths) {
        var params = findLMSParameters(dataSet, gender, ageMonths),
            L,M,S;

        if (!params) return undefined;
        else {
            L = params.L;
            M = params.M;
            S = params.S;
        }

        if (L !== 0) return M * Math.pow(1 + L * S * Z, 1/L);
        else return M * Math.exp(S * Z);
    };

    GC.findZFromX = function(X, dataSet, gender, ageMonths) {
        var params = findLMSParameters(dataSet, gender, ageMonths),
            L,M,S;

        if (!params) return undefined;
        else {
            L = params.L;
            M = params.M;
            S = params.S;
        }

        if (L !== 0) return (Math.pow(X/M, L) - 1) / (L * S);
        else return Math.log(X/M)/S;
    };

    GC.findXFromPercentile = function(percentile, dataSet, gender, ageMonths) {
        var Z = Math.normsinv(percentile);
        return GC.findXFromZ(Z, dataSet, gender, ageMonths);
    };

    GC.findPercentileFromX = function(X, dataSet, gender, ageMonths) {
        var Z = GC.findZFromX(X, dataSet, gender, ageMonths);
        return Math.normsdist(Z);
    };

}());
