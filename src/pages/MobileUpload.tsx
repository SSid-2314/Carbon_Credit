import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, FileText, Camera, MapPin, Smartphone } from 'lucide-react';

const MobileUpload = () => {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...files]);
      toast({
        title: 'Files Added',
        description: `${files.length} file(s) ready for upload`
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
      toast({
        title: 'Files Selected',
        description: `${files.length} file(s) ready for upload`
      });
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    // This is a placeholder for actual file upload functionality
    toast({
      title: 'Upload Simulation',
      description: 'File upload functionality will be integrated with Supabase Storage'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mobile Upload Center</h1>
        <p className="text-muted-foreground">
          Upload photos, documents, and data from your mobile devices
        </p>
      </div>

      {/* Upload Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Mobile Upload Guidelines
          </CardTitle>
          <CardDescription>
            Best practices for uploading project documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Camera className="w-4 h-4 mr-2" />
                Photo Requirements
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• High resolution (minimum 1080p)</li>
                <li>• Clear, well-lit images</li>
                <li>• Include GPS coordinates when possible</li>
                <li>• Show project boundaries and key features</li>
                <li>• Before/during/after restoration photos</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Document Types
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Site surveys and assessments</li>
                <li>• Environmental impact reports</li>
                <li>• Community consent forms</li>
                <li>• Restoration methodology documents</li>
                <li>• Monitoring and measurement data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Drag and drop files or click to select
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload Project Files</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            
            <Input
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer">
                Choose Files
              </Button>
            </Label>
            
            <p className="text-xs text-muted-foreground mt-2">
              Supported: Images, PDF, DOC, DOCX, XLS, XLSX (Max 10MB each)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Files ({uploadedFiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {file.type.startsWith('image/') ? (
                      <Image className="w-5 h-5 text-blue-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            
            <Button onClick={uploadFiles} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload {uploadedFiles.length} File(s)
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Location Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Location Services
          </CardTitle>
          <CardDescription>
            Enable location services for automatic GPS tagging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-semibold">GPS Coordinate Tagging</h4>
              <p className="text-sm text-muted-foreground">
                Automatically add location data to uploaded photos
              </p>
            </div>
            <Button variant="outline">
              Enable GPS
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-primary/5 rounded-lg">
            <h4 className="font-semibold mb-2">Why GPS Matters</h4>
            <p className="text-sm text-muted-foreground">
              GPS coordinates help verify project locations, ensure accurate mapping, 
              and provide transparency for carbon credit verification. This data is 
              crucial for project validation and monitoring.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileUpload;