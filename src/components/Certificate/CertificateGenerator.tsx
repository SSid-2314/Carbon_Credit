import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Award, FileText } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  location: string;
  area_hectares: number;
  verified_at: string;
  estimated_credits: number;
  profiles?: {
    full_name: string;
    organization?: string;
  };
  verifier_profile?: {
    full_name: string;
  };
}

interface CertificateGeneratorProps {
  project: Project;
  disabled?: boolean;
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({ project, disabled }) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const generateCertificate = async () => {
    try {
      // Create certificate content
      const certificateElement = document.createElement('div');
      certificateElement.innerHTML = `
        <div style="
          width: 800px;
          height: 600px;
          padding: 60px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          font-family: Arial, sans-serif;
          position: relative;
          border: 8px solid #0ea5e9;
        ">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="
              font-size: 36px;
              color: #0c4a6e;
              margin: 0 0 10px 0;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 2px;
            ">Carbon Credit Certificate</h1>
            <div style="
              width: 100px;
              height: 4px;
              background: linear-gradient(90deg, #22c55e, #059669);
              margin: 0 auto;
            "></div>
          </div>

          <!-- Award Icon -->
          <div style="text-align: center; margin: 30px 0;">
            <div style="
              display: inline-block;
              width: 80px;
              height: 80px;
              background: linear-gradient(135deg, #fbbf24, #f59e0b);
              border-radius: 50%;
              border: 4px solid white;
              box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
              position: relative;
            ">
              <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 36px;
                color: white;
              ">★</div>
            </div>
          </div>

          <!-- Certificate Body -->
          <div style="text-align: center; margin: 40px 0;">
            <p style="font-size: 18px; color: #374151; margin: 0 0 20px 0;">
              This certificate is awarded to
            </p>
            <h2 style="
              font-size: 28px;
              color: #059669;
              margin: 0 0 30px 0;
              font-weight: bold;
            ">${project.profiles?.full_name || 'Project Owner'}</h2>
            <p style="font-size: 16px; color: #374151; margin: 0 0 10px 0;">
              For the successful implementation of the environmental project
            </p>
            <h3 style="
              font-size: 22px;
              color: #0c4a6e;
              margin: 0 0 30px 0;
              font-weight: bold;
            ">"${project.title}"</h3>
          </div>

          <!-- Project Details -->
          <div style="
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            margin: 30px 0;
          ">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                  <strong>Location:</strong> ${project.location}
                </p>
                <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                  <strong>Area:</strong> ${project.area_hectares} hectares
                </p>
              </div>
              <div>
                <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                  <strong>Carbon Credits:</strong> ${project.estimated_credits} tCO2e
                </p>
                <p style="margin: 8px 0; color: #374151; font-size: 14px;">
                  <strong>Verified Date:</strong> ${new Date(project.verified_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
          ">
            <div style="text-align: left;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                Certificate ID: CERT-${project.id.substring(0, 8).toUpperCase()}
              </p>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">
                Issued: ${new Date().toLocaleDateString()}
              </p>
            </div>
            <div style="text-align: right;">
              <div style="
                width: 120px;
                height: 60px;
                border: 2px solid #059669;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: white;
              ">
                <div style="text-align: center;">
                  <div style="font-size: 10px; color: #059669; font-weight: bold;">
                    VERIFIED BY
                  </div>
                  <div style="font-size: 12px; color: #374151; margin-top: 5px;">
                    ${project.verifier_profile?.full_name || 'Authorized Verifier'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      // Add to DOM temporarily
      certificateElement.style.position = 'absolute';
      certificateElement.style.left = '-9999px';
      document.body.appendChild(certificateElement);

      // Convert to canvas
      const canvas = await html2canvas(certificateElement, {
        width: 800,
        height: 600,
        scale: 2,
        backgroundColor: '#ffffff'
      });

      // Remove from DOM
      document.body.removeChild(certificateElement);

      // Create PDF
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const imgWidth = 280;
      const imgHeight = 210;
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

      // Generate filename
      const filename = `carbon_certificate_${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;

      // Save certificate record to database if user is verifier
      if (profile?.role === 'verifier') {
        const { error: insertError } = await supabase
          .from('certificates')
          .insert({
            project_id: project.id,
            certificate_url: filename,
            generated_by: profile.id
          });

        if (insertError) {
          console.error('Error saving certificate record:', insertError);
        }
      }

      // Download PDF
      pdf.save(filename);

      toast({
        title: 'Certificate Generated',
        description: 'Carbon credit certificate has been downloaded successfully',
      });

    } catch (error: any) {
      console.error('Error generating certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate certificate. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (disabled || project.verified_at === null) {
    return (
      <Button disabled variant="outline" className="opacity-50">
        <Award className="w-4 h-4 mr-2" />
        Certificate (Pending Verification)
      </Button>
    );
  }

  return (
    <Button onClick={generateCertificate} className="bg-blue-600 hover:bg-blue-700">
      <Download className="w-4 h-4 mr-2" />
      Download Certificate
    </Button>
  );
};

export default CertificateGenerator;
