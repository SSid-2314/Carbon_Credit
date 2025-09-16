import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Shield, TrendingUp, Users } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Leaf,
      title: 'Carbon Credit Trading',
      description: 'Trade verified blue carbon credits from coastal ecosystem restoration projects'
    },
    {
      icon: Shield,
      title: 'Verified Projects',
      description: 'All projects undergo rigorous verification by certified professionals'
    },
    {
      icon: TrendingUp,
      title: 'Track Impact',
      description: 'Monitor your carbon footprint reduction and environmental impact in real-time'
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Connect with NGOs, Panchayats, and verifiers in a transparent ecosystem'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-20 px-4 bg-gradient-to-br from-primary/20 to-secondary/30 rounded-xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-primary mb-6">
            BlueCarbon Credits Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Revolutionizing coastal ecosystem restoration through verified carbon credits. 
            Join the movement to protect our blue carbon ecosystems while creating economic value.
          </p>
          
          {user ? (
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="text-lg px-8 py-3"
            >
              Go to Dashboard
            </Button>
          ) : (
            <div className="space-x-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/login')}
                className="text-lg px-8 py-3"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate('/signup')}
                className="text-lg px-8 py-3"
              >
                Learn More
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose BlueCarbon Credits?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="text-center">
                  <CardHeader>
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16 bg-primary/5 rounded-xl">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Platform Impact</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1,250+</div>
              <div className="text-muted-foreground">Hectares Restored</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50,000+</div>
              <div className="text-muted-foreground">Carbon Credits Issued</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">200+</div>
              <div className="text-muted-foreground">Active Projects</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="text-center py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Ready to Make an Impact?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of organizations and individuals working together to restore coastal ecosystems.
            </p>
            <Button 
              size="lg" 
              onClick={() => navigate('/signup')}
              className="text-lg px-8 py-3"
            >
              Sign Up Today
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;