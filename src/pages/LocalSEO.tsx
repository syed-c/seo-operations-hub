import { MainLayout } from "@/components/layout/MainLayout";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, PhoneCall, Star } from "lucide-react";

const locations = [
  { city: "Dubai", views: "18.4K", calls: 212, rating: 4.6 },
  { city: "Manchester", views: "9.2K", calls: 88, rating: 4.4 },
  { city: "Modesto", views: "4.1K", calls: 45, rating: 4.2 },
];

export default function LocalSEO() {
  return (
    <MainLayout>
      <Header title="Local SEO" subtitle="Google Business Profile performance by location" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => (
          <Card
            key={loc.city}
            className="glass-card animate-slide-up hover:shadow-card-hover transition-all"
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <CardTitle>{loc.city}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{loc.views} map views</p>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <PhoneCall className="w-4 h-4" />
                {loc.calls} calls
              </div>
              <div className="flex items-center gap-1 text-warning">
                <Star className="w-4 h-4" />
                {loc.rating.toFixed(1)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}

