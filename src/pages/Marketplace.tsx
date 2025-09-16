import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Store, Leaf, DollarSign, MapPin, Calendar, TrendingUp } from 'lucide-react';

interface MarketplaceListing {
  id: string;
  price_per_credit: number;
  credits_available: number;
  status: string;
  created_at: string;
  carbon_credits: {
    id: string;
    credits_amount: number;
    projects: {
      title: string;
      location: string;
      area_hectares: number;
    };
  };
  profiles: {
    full_name: string;
    organization?: string;
  };
}

const Marketplace = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [userCredits, setUserCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [newListing, setNewListing] = useState({
    creditId: '',
    pricePerCredit: '',
    creditsToSell: ''
  });

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      // Fetch active marketplace listings
      const { data: listingsData, error: listingsError } = await supabase
        .from('marketplace_listings')
        .select(`
          *,
          carbon_credits (
            id,
            credits_amount,
            projects (
              title,
              location,
              area_hectares
            )
          ),
          profiles!marketplace_listings_seller_id_fkey (
            full_name,
            organization
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;
      setListings(listingsData || []);

      // Fetch user's available credits for selling
      if (profile) {
        const { data: creditsData, error: creditsError } = await supabase
          .from('carbon_credits')
          .select(`
            *,
            projects (
              title,
              location
            )
          `)
          .eq('owner_id', profile.id)
          .eq('status', 'active');

        if (creditsError) throw creditsError;
        setUserCredits(creditsData || []);
      }

    } catch (error) {
      console.error('Error fetching marketplace data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createListing = async () => {
    if (!profile || !newListing.creditId || !newListing.pricePerCredit || !newListing.creditsToSell) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('marketplace_listings')
        .insert({
          credit_id: newListing.creditId,
          seller_id: profile.id,
          price_per_credit: parseFloat(newListing.pricePerCredit),
          credits_available: parseFloat(newListing.creditsToSell),
          status: 'active'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your listing has been created successfully!'
      });

      setShowCreateListing(false);
      setNewListing({ creditId: '', pricePerCredit: '', creditsToSell: '' });
      fetchMarketplaceData();

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create listing',
        variant: 'destructive'
      });
    }
  };

  const purchaseCredits = async (listingId: string, creditsAmount: number, pricePerCredit: number) => {
    if (!profile) {
      toast({
        title: 'Error',
        description: 'You must be logged in to purchase credits',
        variant: 'destructive'
      });
      return;
    }

    // This is a simplified purchase flow
    toast({
      title: 'Purchase Simulation',
      description: `Would purchase ${creditsAmount} credits for $${(creditsAmount * pricePerCredit).toFixed(2)}. Integration with payment system pending.`
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Carbon Credit Marketplace</h1>
          <p className="text-muted-foreground">
            Buy and sell verified blue carbon credits
          </p>
        </div>
        
        {profile && userCredits.length > 0 && (
          <Button onClick={() => setShowCreateListing(!showCreateListing)}>
            <Store className="w-4 h-4 mr-2" />
            {showCreateListing ? 'Cancel' : 'Create Listing'}
          </Button>
        )}
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{listings.length}</div>
            <p className="text-xs text-muted-foreground">Active Listings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {listings.reduce((sum, listing) => sum + listing.credits_available, 0).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Credits Available</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              $
              {listings.length > 0 
                ? (listings.reduce((sum, listing) => sum + listing.price_per_credit, 0) / listings.length).toFixed(2)
                : '0.00'
              }
            </div>
            <p className="text-xs text-muted-foreground">Avg Price/Credit</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              $
              {listings.reduce((sum, listing) => sum + (listing.credits_available * listing.price_per_credit), 0).toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Total Market Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Listing Form */}
      {showCreateListing && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Listing</CardTitle>
            <CardDescription>
              List your carbon credits for sale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="creditSelect">Select Credit Package</Label>
              <select
                id="creditSelect"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={newListing.creditId}
                onChange={(e) => setNewListing(prev => ({ ...prev, creditId: e.target.value }))}
              >
                <option value="">Choose a credit package...</option>
                {userCredits.map((credit) => (
                  <option key={credit.id} value={credit.id}>
                    {credit.projects?.title} - {credit.credits_amount} credits
                  </option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerCredit">Price per Credit ($)</Label>
                <Input
                  id="pricePerCredit"
                  type="number"
                  step="0.01"
                  value={newListing.pricePerCredit}
                  onChange={(e) => setNewListing(prev => ({ ...prev, pricePerCredit: e.target.value }))}
                  placeholder="25.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="creditsToSell">Credits to Sell</Label>
                <Input
                  id="creditsToSell"
                  type="number"
                  step="0.01"
                  value={newListing.creditsToSell}
                  onChange={(e) => setNewListing(prev => ({ ...prev, creditsToSell: e.target.value }))}
                  placeholder="100"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={createListing}>Create Listing</Button>
              <Button variant="outline" onClick={() => setShowCreateListing(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketplace Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Store className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Listings Available</h3>
            <p className="text-muted-foreground">
              Be the first to list carbon credits for sale!
            </p>
          </div>
        ) : (
          listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {listing.carbon_credits.projects?.title}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {listing.carbon_credits.projects?.location}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <Leaf className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Available Credits</p>
                    <p className="font-semibold">{listing.credits_available} tCO2e</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Price per Credit</p>
                    <p className="font-semibold text-green-600">
                      ${listing.price_per_credit.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="text-sm">
                  <p className="text-muted-foreground">Project Area</p>
                  <p>{listing.carbon_credits.projects?.area_hectares} hectares</p>
                </div>
                
                <div className="text-sm">
                  <p className="text-muted-foreground">Seller</p>
                  <p>{listing.profiles?.full_name}</p>
                  {listing.profiles?.organization && (
                    <p className="text-xs text-muted-foreground">
                      {listing.profiles.organization}
                    </p>
                  )}
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold">
                      Total: ${(listing.credits_available * listing.price_per_credit).toFixed(2)}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => purchaseCredits(
                      listing.id, 
                      listing.credits_available, 
                      listing.price_per_credit
                    )}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Purchase Credits
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  Listed {new Date(listing.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Marketplace;