import React, { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import HotelComparison from "@/components/HotelComparison";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

/**
 * Demo page showing the hotel price comparison integrated into the presentation
 * This page demonstrates how the comparison will appear during the full presentation
 */
export default function PresentationDemo() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch demo comparison data
  const { data: demoData, isLoading: isDataLoading } =
    trpc.hotelComparison.getRandomDemo.useQuery(undefined, {
      enabled: true,
    });

  useEffect(() => {
    if (demoData) {
      setComparisonData(demoData);
    }
  }, [demoData]);

  const handlePlayComparison = () => {
    setIsPlaying(true);
    // Auto-stop after animation completes
    setTimeout(() => {
      setIsPlaying(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Live Hotel Price Comparison Demo
          </h1>
          <p className="text-lg text-muted-foreground">
            This is how the price comparison will appear during the Web3 Matrix
            presentation
          </p>
        </div>

        {/* Narration Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Mario's Narration
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            "Now let me show you something that will absolutely blow your mind.
            I'm going to search for a 5-star hotel in Orlando, Florida for the
            same dates on multiple booking sites, and I want you to watch what
            happens to the price when we compare them to our Wholesale Hotel
            Rates platform."
          </p>
        </div>

        {/* Comparison Display */}
        {isDataLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-lg text-muted-foreground">
              Loading comparison data...
            </span>
          </div>
        ) : comparisonData ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <HotelComparison
              data={comparisonData}
              isAnimating={isPlaying}
            />
          </div>
        ) : null}

        {/* Controls */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={handlePlayComparison}
            disabled={isPlaying || isDataLoading}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            {isPlaying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Comparing...
              </>
            ) : (
              "Play Comparison"
            )}
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            size="lg"
          >
            Load Different Hotel
          </Button>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-3">
          <h3 className="font-semibold text-blue-900">How This Works</h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-start">
              <span className="mr-3 font-bold">1.</span>
              <span>
                Before the presentation, our bot searches multiple booking sites
                and captures screenshots of the pricing
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold">2.</span>
              <span>
                The data is stored in our database with all pricing information
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold">3.</span>
              <span>
                During the presentation, the prices animate in as if being
                searched live, but they're actually pre-fetched from the database
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-3 font-bold">4.</span>
              <span>
                The savings are calculated and displayed with the cash back
                amount (3-5% of WHR price)
              </span>
            </li>
          </ul>
        </div>

        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <h4 className="font-semibold text-green-900 mb-2">✅ Reliable</h4>
            <p className="text-green-800 text-sm">
              No bot detection issues during presentation
            </p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-2">⚡ Fast</h4>
            <p className="text-blue-800 text-sm">
              Instant data retrieval from database
            </p>
          </div>
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6">
            <h4 className="font-semibold text-purple-900 mb-2">🎯 Authentic</h4>
            <p className="text-purple-800 text-sm">
              Looks completely live to the viewer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
