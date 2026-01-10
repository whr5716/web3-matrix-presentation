import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ComparisonData {
  hotelName: string;
  location: string;
  checkInDate: string;
  checkOutDate: string;
  starRating?: number;
  comparisons: {
    platform: string;
    pricePerNight: number;
    totalPrice: number;
    screenshotUrl: string;
  }[];
  savings: {
    savingsAmount: number;
    savingsPercentage: number;
    cashBackAmount: number;
  };
}

interface HotelComparisonProps {
  data: ComparisonData;
  isAnimating?: boolean;
}

export default function HotelComparison({
  data,
  isAnimating = true,
}: HotelComparisonProps) {
  const [displayedPrices, setDisplayedPrices] = useState<
    Record<string, number>
  >({});
  const [showSavings, setShowSavings] = useState(false);

  // Animate price reveal
  useEffect(() => {
    if (!isAnimating) {
      const prices: Record<string, number> = {};
      data.comparisons.forEach((comp) => {
        prices[comp.platform] = comp.totalPrice;
      });
      setDisplayedPrices(prices);
      setShowSavings(true);
      return;
    }

    const delays: Record<string, number> = {
      "hotels.com": 500,
      expedia: 1000,
      "booking.com": 1500,
      wholesalehotelrates: 2000,
    };

    data.comparisons.forEach((comp) => {
      const delay = delays[comp.platform] || 500;
      const timer = setTimeout(() => {
        setDisplayedPrices((prev) => ({
          ...prev,
          [comp.platform]: comp.totalPrice,
        }));
      }, delay);

      return () => clearTimeout(timer);
    });

    const savingsTimer = setTimeout(() => {
      setShowSavings(true);
    }, 2500);

    return () => clearTimeout(savingsTimer);
  }, [data, isAnimating]);

  const whrComparison = data.comparisons.find(
    (c) => c.platform === "wholesalehotelrates"
  );
  const publicComparisons = data.comparisons.filter(
    (c) => c.platform !== "wholesalehotelrates"
  );

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      "hotels.com": "from-blue-500 to-blue-600",
      expedia: "from-yellow-500 to-yellow-600",
      "booking.com": "from-green-500 to-green-600",
      wholesalehotelrates: "from-purple-500 to-purple-600",
    };
    return colors[platform] || "from-gray-500 to-gray-600";
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Hotel Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">{data.hotelName}</h2>
        <p className="text-lg text-muted-foreground">
          {data.location} • {data.starRating}★
        </p>
        <p className="text-sm text-muted-foreground">
          {data.checkInDate} to {data.checkOutDate}
        </p>
      </div>

      {/* Price Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Public Booking Sites */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Public Rates
          </h3>
          {publicComparisons.map((comp) => (
            <Card
              key={comp.platform}
              className={`p-4 border-2 transition-all duration-500 ${
                displayedPrices[comp.platform]
                  ? "opacity-100 scale-100"
                  : "opacity-50 scale-95"
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold capitalize">
                    {comp.platform}
                  </span>
                  {!displayedPrices[comp.platform] && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                </div>
                {displayedPrices[comp.platform] && (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-foreground">
                      ${displayedPrices[comp.platform].toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total for stay
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Wholesale Hotel Rates */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">
            Web3 Matrix Rate
          </h3>
          {whrComparison && (
            <Card
              className={`p-4 border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-transparent transition-all duration-500 ${
                displayedPrices[whrComparison.platform]
                  ? "opacity-100 scale-100"
                  : "opacity-50 scale-95"
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Wholesale Hotel Rates</span>
                  {!displayedPrices[whrComparison.platform] && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                </div>
                {displayedPrices[whrComparison.platform] && (
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-purple-600">
                      ${displayedPrices[whrComparison.platform].toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total for stay
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Savings Summary */}
      {showSavings && (
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xl font-bold text-green-900 mb-4">
            Your Savings
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-green-700">Total Savings</p>
              <p className="text-2xl font-bold text-green-600">
                ${data.savings.savingsAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700">Percentage Off</p>
              <p className="text-2xl font-bold text-green-600">
                {data.savings.savingsPercentage.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-green-700">Cash Back</p>
              <p className="text-2xl font-bold text-green-600">
                ${data.savings.cashBackAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
