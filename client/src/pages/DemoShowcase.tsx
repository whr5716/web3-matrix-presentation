import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, DollarSign, Video } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

export default function DemoShowcase() {
  const [activeTab, setActiveTab] = useState("video");

  // Fetch hotel comparison data
  const { data: demo, isLoading: isLoadingComparisons } =
    trpc.hotelComparison.getRandomDemo.useQuery(undefined, {
      enabled: true,
    });

  // Extract public and wholesale prices
  const publicComparison = demo?.comparisons.find(
    (c) => c.platform !== "wholesalehotelrates"
  );
  const wholesaleComparison = demo?.comparisons.find(
    (c) => c.platform === "wholesalehotelrates"
  );

  const nights = 3; // Default nights for calculation

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-foreground">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                Web3 Matrix Presentation Demo - Live with Database
              </h1>
              <p className="text-slate-400 mt-2">
                Evaluate the presentation experience and hotel comparison feature
              </p>
            </div>
            <Badge className="w-fit bg-green-600 hover:bg-green-700">
              Live Demo
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Navigation */}
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-800 border border-slate-700 p-1 rounded-lg">
            <TabsTrigger
              value="video"
              className="text-white px-4 py-2 rounded data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm"
            >
              <Video className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Demo Video</span>
              <span className="sm:hidden">Video</span>
            </TabsTrigger>
            <TabsTrigger
              value="comparison"
              className="text-white px-4 py-2 rounded data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm"
            >
              <DollarSign className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Hotel Comparison</span>
              <span className="sm:hidden">Comparison</span>
            </TabsTrigger>
          </TabsList>

          {/* Demo Video Tab */}
          <TabsContent value="video" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Mario's Presentation</CardTitle>
                <CardDescription>
                  Watch the AI presenter Mario deliver the opening hook with professional narration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Video Player */}
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <video
                      controls
                      className="w-full h-full"
                      poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'%3E%3Crect fill='%23000' width='1280' height='720'/%3E%3C/svg%3E"
                    >
                      <source
                        src="/mario-talking-full-30sec.mp4"
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  {/* Video Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Play className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                          <p className="text-sm text-slate-300">Duration</p>
                          <p className="text-lg font-semibold text-white">27 seconds</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Video className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                          <p className="text-sm text-slate-300">Format</p>
                          <p className="text-lg font-semibold text-white">1080p</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-slate-700 border-slate-600">
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Badge className="bg-green-600 mx-auto mb-2">Live</Badge>
                          <p className="text-sm text-slate-300">Status</p>
                          <p className="text-lg font-semibold text-white">Ready</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Description */}
                  <Card className="bg-slate-700 border-slate-600">
                    <CardHeader>
                      <CardTitle className="text-base text-white">
                        What You're Seeing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-slate-300 text-sm">
                      <p>
                        ✅ <strong>Animated Talking Avatar:</strong> Mario G. Rodriguez, "The Hyper Driver," speaking with synchronized lip-sync and natural gestures
                      </p>
                      <p>
                        ✅ <strong>Professional Narration:</strong> Clean, crisp voice narration with proper pacing and emotional delivery
                      </p>
                      <p>
                        ✅ <strong>Dynamic Text Overlays:</strong> Key messaging appears as Mario speaks
                      </p>
                      <p>
                        ✅ <strong>Responsive Design:</strong> Works perfectly on mobile phones and desktop screens
                      </p>
                      <p>
                        ✅ <strong>Browser Compatible:</strong> Includes fallbacks for older browsers
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hotel Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Live Hotel Price Comparison</CardTitle>
                <CardDescription>
                  See how Wholesale Hotel Rates compares to public booking sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingComparisons ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400 mr-2" />
                    <span className="text-slate-300">Loading comparison data...</span>
                  </div>
                ) : demo ? (
                  <div className="space-y-6">
                    {/* Hotel Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-slate-700 border-slate-600">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-white mb-2">
                            {demo.hotelName}
                          </h3>
                          <p className="text-sm text-slate-400 mb-3">
                            {demo.location}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-600">
                              ★ {demo.starRating || 4.5}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {nights} nights
                            </span>
                          </div>
                          {demo.description && (
                            <p className="text-xs text-slate-400 mt-3">
                              {demo.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Dates Info */}
                      <Card className="bg-slate-700 border-slate-600">
                        <CardContent className="pt-6 space-y-4">
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide">
                              Check-in
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {demo.checkInDate}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wide">
                              Check-out
                            </p>
                            <p className="text-lg font-semibold text-white">
                              {demo.checkOutDate}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Price Comparison - All Platforms */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {demo.comparisons.map((comparison, idx) => {
                        const isWholesale =
                          comparison.platform === "wholesalehotelrates";
                        return (
                          <Card
                            key={idx}
                            className={
                              isWholesale
                                ? "bg-green-900/30 border-green-700"
                                : "bg-slate-700 border-slate-600"
                            }
                          >
                            <CardHeader>
                              <CardTitle className="text-base capitalize">
                                {isWholesale ? (
                                  <span className="text-green-400">
                                    Wholesale Hotel Rates
                                  </span>
                                ) : (
                                  <span className="text-slate-200">
                                    {comparison.platform}
                                  </span>
                                )}
                              </CardTitle>
                              <CardDescription>
                                {isWholesale
                                  ? "Web3 Matrix Member Price"
                                  : "Public booking site"}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center">
                                <p
                                  className={
                                    isWholesale
                                      ? "text-4xl font-bold text-green-400 mb-2"
                                      : "text-4xl font-bold text-white mb-2"
                                  }
                                >
                                  ${comparison.pricePerNight}
                                </p>
                                <p
                                  className={
                                    isWholesale
                                      ? "text-sm text-green-300"
                                      : "text-sm text-slate-400"
                                  }
                                >
                                  per night
                                </p>
                                <p
                                  className={
                                    isWholesale
                                      ? "text-lg font-semibold text-green-300 mt-3"
                                      : "text-lg font-semibold text-slate-300 mt-3"
                                  }
                                >
                                  Total: ${comparison.totalPrice}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Savings Summary */}
                    <Card className="bg-blue-900/30 border-blue-700">
                      <CardHeader>
                        <CardTitle className="text-white">Your Savings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-blue-300 mb-1">Total Savings</p>
                            <p className="text-2xl font-bold text-blue-400">
                              ${demo.savings.savingsAmount.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-300 mb-1">Savings %</p>
                            <p className="text-2xl font-bold text-blue-400">
                              {demo.savings.savingsPercentage.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-300 mb-1">Cash Back</p>
                            <p className="text-2xl font-bold text-blue-400">
                              ${demo.savings.cashBackAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* How It Works */}
                    <Card className="bg-slate-700 border-slate-600">
                      <CardHeader>
                        <CardTitle className="text-base text-white">
                          How This Works in the Full Presentation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-slate-300">
                        <div className="flex gap-3">
                          <Badge className="bg-blue-600 h-fit">1</Badge>
                          <p>
                            <strong>Before Presentation:</strong> Our bot searches multiple booking sites and collects real pricing data
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Badge className="bg-blue-600 h-fit">2</Badge>
                          <p>
                            <strong>Data Storage:</strong> All prices and screenshots are stored in our database
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Badge className="bg-blue-600 h-fit">3</Badge>
                          <p>
                            <strong>During Presentation:</strong> Mario narrates while the comparison displays, looking completely live
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Badge className="bg-blue-600 h-fit">4</Badge>
                          <p>
                            <strong>Reliability:</strong> No bot detection issues, perfect timing, real data
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <Card className="mt-8 bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-400 text-center">
              This demo showcases the two core components of the Web3 Matrix presentation:
              the engaging video presentation and the powerful price comparison feature.
              Both are fully responsive and ready for your team to evaluate.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
