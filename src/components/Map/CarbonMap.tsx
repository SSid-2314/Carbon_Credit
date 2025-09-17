import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Leaf } from 'lucide-react';

interface MapboxProject {
  id: string;
  title: string;
  location: string;
  gps_coordinates: {
    lat: number;
    lng: number;
  };
  area_hectares: number;
  estimated_credits: number;
  status: string;
}

const CarbonMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { profile } = useAuth();
  const { toast } = useToast();
  const [mapboxToken, setMapboxToken] = useState('');
  const [projects, setProjects] = useState<MapboxProject[]>([]);
  const [showTokenInput, setShowTokenInput] = useState(true);

  useEffect(() => {
    // Check if we have a stored token
    const storedToken = localStorage.getItem('mapbox_token');
    if (storedToken) {
      setMapboxToken(storedToken);
      setShowTokenInput(false);
      initializeMap(storedToken);
    }
  }, []);

  useEffect(() => {
    if (profile && !showTokenInput) {
      fetchProjects();
    }
  }, [profile, showTokenInput]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapboxToken.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your Mapbox token',
        variant: 'destructive'
      });
      return;
    }

    localStorage.setItem('mapbox_token', mapboxToken);
    setShowTokenInput(false);
    initializeMap(mapboxToken);
  };

  const initializeMap = (token: string) => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [77.1025, 28.7041], // Delhi coordinates as default
      zoom: 5,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
  };

  const fetchProjects = async () => {
    if (!profile) return;

    try {
      let query = supabase.from('projects').select('*');
      
      // Role-based filtering
      if (profile.role !== 'admin') {
        if (profile.role === 'verifier') {
          query = query.in('status', ['verified', 'under_review']);
        } else {
          query = query.eq('submitter_id', profile.id);
        }
      }

      const { data, error } = await query
        .not('gps_coordinates', 'is', null)
        .eq('status', 'verified'); // Only show verified projects on map

      if (error) throw error;

      const validProjects = data?.filter(project => 
        project.gps_coordinates && 
        project.gps_coordinates.lat && 
        project.gps_coordinates.lng
      ) || [];

      setProjects(validProjects);
      
      if (map.current && validProjects.length > 0) {
        addMarkersToMap(validProjects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project locations',
        variant: 'destructive'
      });
    }
  };

  const addMarkersToMap = (projects: MapboxProject[]) => {
    if (!map.current) return;

    projects.forEach((project) => {
      const { lat, lng } = project.gps_coordinates;
      
      // Create a popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3">
          <h3 class="font-semibold text-sm">${project.title}</h3>
          <p class="text-xs text-gray-600 mt-1">${project.location}</p>
          <p class="text-xs text-gray-600">${project.area_hectares} hectares</p>
          <div class="flex items-center mt-2">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z"/>
              </svg>
              ${project.estimated_credits} tCO2e
            </span>
          </div>
        </div>
      `);

      // Create a marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'carbon-marker';
      markerElement.innerHTML = `
        <div style="
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
      `;

      // Add marker to map
      new mapboxgl.Marker(markerElement)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);
    });

    // Fit map to show all markers
    if (projects.length > 0) {
      const coordinates = projects.map(p => [p.gps_coordinates.lng, p.gps_coordinates.lat]);
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord as [number, number]);
      }, new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number]));

      map.current.fitBounds(bounds, {
        padding: 50
      });
    }
  };

  if (showTokenInput) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Mapbox Setup Required
          </CardTitle>
          <CardDescription>
            Please enter your Mapbox public token to display the carbon credits map.
            Get your token from{' '}
            <a 
              href="https://account.mapbox.com/access-tokens/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Mapbox Public Token</Label>
              <Input
                id="token"
                type="text"
                value={mapboxToken}
                onChange={(e) => setMapboxToken(e.target.value)}
                placeholder="pk.eyJ1IjoieW91cnVzZXJuYW1lIi..."
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Initialize Map
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Leaf className="w-5 h-5 mr-2 text-green-600" />
          <h3 className="text-lg font-semibold">Carbon Credits Map</h3>
        </div>
        <div className="text-sm text-muted-foreground">
          {projects.length} verified project{projects.length !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="relative w-full h-[500px] rounded-lg overflow-hidden border">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {projects.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No verified projects with GPS coordinates found
              </p>
            </div>
          </div>
        )}
      </div>
      
      {projects.length > 0 && (
        <div className="text-xs text-muted-foreground">
          * Green markers show verified plantation projects. Click on markers to see project details.
        </div>
      )}
    </div>
  );
};

export default CarbonMap;
