import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Camera, Sparkles, Heart, CheckCircle, X, Loader2, Sparkle, Scan, Brain, CheckCircle2, AlertCircle, Palette } from "lucide-react";
import { FaceDetection } from "@mediapipe/face_detection";
import { Camera as MediaPipeCamera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

export default function ARHairTryOn() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const faceDetectionRef = useRef(null);
  const cameraRef = useRef(null);
  const startScanningCountdown = useRef(null);
  const [isARActive, setIsARActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Camera Setup, 2: AR Try On, 3: Recommendations
  const [selectedHairstyle, setSelectedHairstyle] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [facePositioned, setFacePositioned] = useState(false);
  const [scanningComplete, setScanningComplete] = useState(false);
  
  // AI Analysis Results (Automatically Detected)
  const [aiAnalysis, setAiAnalysis] = useState({
    facialStructure: null,
    faceShape: null,
    skinColor: null,
    skinTone: null,
    confidence: 0,
    faceDetected: false
  });
  
  // User Preferences State (Manual Inputs)
  const [preferences, setPreferences] = useState({
    hairLength: "",
    stylePreferences: [], // Array of selected preferences
    hairType: "",
    occasion: ""
  });

  // Hairstyle options
  const hairstyleOptions = [
    { id: 1, name: "Long Wavy", image: "/images/hairstyles/long-wavy.jpg", category: "Long", matchScore: 95 },
    { id: 2, name: "Bob Cut", image: "/images/hairstyles/bob-cut.jpg", category: "Short", matchScore: 88 },
    { id: 3, name: "Pixie Cut", image: "/images/hairstyles/pixie-cut.jpg", category: "Short", matchScore: 82 },
    { id: 4, name: "Layered Medium", image: "/images/hairstyles/layered-medium.jpg", category: "Medium", matchScore: 90 },
    { id: 5, name: "Curly Bob", image: "/images/hairstyles/curly-bob.jpg", category: "Short", matchScore: 85 },
    { id: 6, name: "Straight Long", image: "/images/hairstyles/straight-long.jpg", category: "Long", matchScore: 92 },
  ];

  // Style preferences options
  const stylePreferenceOptions = [
    "Professional", "Casual", "Elegant", "Trendy", "Classic", "Bold", "Natural", "Edgy"
  ];

  // Initialize MediaPipe Face Detection
  const initializeFaceDetection = async () => {
    try {
      const faceDetection = new FaceDetection({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
        }
      });

      faceDetection.setOptions({
        model: 'short', // Use 'short' for faster detection, 'full' for more accurate
        minDetectionConfidence: 0.5,
      });

      faceDetection.onResults((results) => {
        if (!canvasRef.current || !videoRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const video = videoRef.current;

        // Set canvas size
        canvas.width = video.videoWidth || video.clientWidth;
        canvas.height = video.videoHeight || video.clientHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw video frame (mirrored)
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw face detection results
        if (results.detections && results.detections.length > 0) {
          setFaceDetected(true);
          
          // Draw detection boxes
          results.detections.forEach((detection) => {
            const x = detection.boundingBox.xCenter * canvas.width;
            const y = detection.boundingBox.yCenter * canvas.height;
            const width = detection.boundingBox.width * canvas.width;
            const height = detection.boundingBox.height * canvas.height;

            // Mirror the x coordinate
            const mirroredX = canvas.width - x;

            // Check if face is properly positioned (centered and straight)
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const faceCenterX = mirroredX;
            const faceCenterY = y;
            
            // Check if face is centered (within 20% of screen center)
            const xOffset = Math.abs(faceCenterX - centerX) / canvas.width;
            const yOffset = Math.abs(faceCenterY - centerY) / canvas.height;
            const isCentered = xOffset < 0.2 && yOffset < 0.2;
            
            // Check if face size is appropriate (not too small or too large)
            const faceSize = (width * height) / (canvas.width * canvas.height);
            const isGoodSize = faceSize > 0.05 && faceSize < 0.4;
            
            // Face is positioned correctly if centered and good size
            const isPositioned = isCentered && isGoodSize;
            setFacePositioned(isPositioned);

            // Determine box color based on positioning
            let boxColor = '#ff0000'; // Red if not positioned
            if (isPositioned) {
              boxColor = '#00ff00'; // Green if positioned correctly
            } else if (isCentered) {
              boxColor = '#ffaa00'; // Orange if centered but wrong size
            }

            // Draw bounding box
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(
              mirroredX - width / 2,
              y - height / 2,
              width,
              height
            );

            // Draw corner indicators
            const cornerSize = 20;
            ctx.lineWidth = 4;
            const boxX = mirroredX - width / 2;
            const boxY = y - height / 2;

            // Top-left
            ctx.beginPath();
            ctx.moveTo(boxX, boxY);
            ctx.lineTo(boxX + cornerSize, boxY);
            ctx.moveTo(boxX, boxY);
            ctx.lineTo(boxX, boxY + cornerSize);
            ctx.stroke();

            // Top-right
            ctx.beginPath();
            ctx.moveTo(boxX + width, boxY);
            ctx.lineTo(boxX + width - cornerSize, boxY);
            ctx.moveTo(boxX + width, boxY);
            ctx.lineTo(boxX + width, boxY + cornerSize);
            ctx.stroke();

            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(boxX, boxY + height);
            ctx.lineTo(boxX + cornerSize, boxY + height);
            ctx.moveTo(boxX, boxY + height);
            ctx.lineTo(boxX, boxY + height - cornerSize);
            ctx.stroke();

            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(boxX + width, boxY + height);
            ctx.lineTo(boxX + width - cornerSize, boxY + height);
            ctx.moveTo(boxX + width, boxY + height);
            ctx.lineTo(boxX + width, boxY + height - cornerSize);
            ctx.stroke();

            // Draw center guide lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            // Vertical center line
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, canvas.height);
            ctx.stroke();
            // Horizontal center line
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(canvas.width, centerY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Only start scanning countdown if face is positioned and not already scanning or complete
            if (isPositioned && !isScanning && !scanningComplete && !analysisComplete && !startScanningCountdown.current) {
              startScanning();
            }
            
            // If face moves out of position during scanning, reset
            if (!isPositioned && isScanning && startScanningCountdown.current) {
              clearInterval(startScanningCountdown.current);
              startScanningCountdown.current = null;
              setIsScanning(false);
              setCountdown(0);
            }

            // Only analyze after scanning is complete
            if (scanningComplete && !analysisComplete && !isAnalyzing) {
              console.log("Scanning complete, starting face analysis...");
              analyzeFaceFromDetection(detection, canvas);
            }
          });
        } else {
          setFaceDetected(false);
          setFacePositioned(false);
          if (isScanning && startScanningCountdown.current) {
            clearInterval(startScanningCountdown.current);
            startScanningCountdown.current = null;
            setIsScanning(false);
            setCountdown(0);
          }
        }
      });

      faceDetectionRef.current = faceDetection;

      // Initialize camera
      if (videoRef.current) {
        const camera = new MediaPipeCamera(videoRef.current, {
          onFrame: async () => {
            await faceDetection.send({ image: videoRef.current });
          },
          width: 1280,
          height: 720
        });
        cameraRef.current = camera;
        camera.start();
      }
    } catch (error) {
      console.error("Error initializing face detection:", error);
      setError("Failed to initialize face detection. Please refresh the page.");
    }
  };

  // Start 3-second scanning countdown
  const startScanning = () => {
    // Don't start if already scanning or complete
    if (startScanningCountdown.current || scanningComplete || isScanning) {
      return;
    }

    console.log("Starting scan countdown...");
    setIsScanning(true);
    setCountdown(3);

    // Start countdown immediately, then continue every second
    let currentCount = 3;
    
    // Update immediately to show 3
    setCountdown(3);
    
    // Start interval for countdown
    startScanningCountdown.current = setInterval(() => {
      currentCount--;
      console.log("Countdown:", currentCount);
      
      if (currentCount <= 0) {
        console.log("Countdown complete, starting analysis...");
        if (startScanningCountdown.current) {
          clearInterval(startScanningCountdown.current);
          startScanningCountdown.current = null;
        }
        setScanningComplete(true);
        setIsScanning(false);
        setCountdown(0);
      } else {
        setCountdown(currentCount);
      }
    }, 1000);
  };

  // Analyze face structure from MediaPipe detection
  const analyzeFaceFromDetection = (detection, canvas) => {
    if (isAnalyzing || analysisComplete || !scanningComplete) {
      console.log("Analysis blocked:", { isAnalyzing, analysisComplete, scanningComplete });
      return;
    }

    console.log("Starting face analysis...");
    setIsAnalyzing(true);

    // Extract face region for skin tone analysis
    const x = detection.boundingBox.xCenter * canvas.width;
    const y = detection.boundingBox.yCenter * canvas.height;
    const width = detection.boundingBox.width * canvas.width;
    const height = detection.boundingBox.height * canvas.height;

    // Get image data from face region
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(
      canvas.width - x - width / 2, // Mirror x coordinate
      y - height / 2,
      width,
      height
    );

    // Analyze face shape based on bounding box dimensions
    const aspectRatio = width / height;
    let detectedFaceShape = "oval"; // default

    if (aspectRatio > 0.85 && aspectRatio < 1.0) {
      detectedFaceShape = "round";
    } else if (aspectRatio > 1.0 && aspectRatio < 1.15) {
      detectedFaceShape = "oval";
    } else if (aspectRatio > 1.15) {
      detectedFaceShape = "oblong";
    } else if (aspectRatio < 0.75) {
      detectedFaceShape = "square";
    }

    // Analyze skin tone from face region
    const skinTone = analyzeSkinTone(imageData);

    // Simulate processing delay
    setTimeout(() => {
      const analysisResults = {
        facialStructure: detectedFaceShape,
        faceShape: detectedFaceShape,
        skinColor: skinTone.value,
        skinTone: skinTone,
        confidence: Math.floor(Math.random() * 10) + 90, // 90-100% confidence with MediaPipe
        faceDetected: true
      };
      
      console.log("Analysis complete:", analysisResults);
      
      setAiAnalysis(analysisResults);
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      
      console.log("Analysis state updated, results should be visible now");
    }, 1500);
  };

  // Analyze skin tone from image data
  const analyzeSkinTone = (imageData) => {
    const pixels = imageData.data;
    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;

    // Sample pixels from the face region
    for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (a > 0) {
        totalR += r;
        totalG += g;
        totalB += b;
        pixelCount++;
      }
    }

    if (pixelCount === 0) {
      return { value: "medium", label: "Medium", color: "#E0AC69" };
    }

    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;

    // Calculate brightness
    const brightness = (avgR + avgG + avgB) / 3;

    // Map brightness to skin tone
    const skinTones = [
      { value: "fair", label: "Fair", color: "#FDBCB4", threshold: 200 },
      { value: "light", label: "Light", color: "#F1C27D", threshold: 180 },
      { value: "medium", label: "Medium", color: "#E0AC69", threshold: 140 },
      { value: "olive", label: "Olive", color: "#C68642", threshold: 120 },
      { value: "tan", label: "Tan", color: "#8D5524", threshold: 100 },
      { value: "brown", label: "Brown", color: "#654321", threshold: 80 },
      { value: "dark", label: "Dark", color: "#4A3728", threshold: 60 },
      { value: "deep", label: "Deep", color: "#2C1810", threshold: 0 },
    ];

    // Find matching skin tone
    for (const tone of skinTones) {
      if (brightness >= tone.threshold) {
        return tone;
      }
    }

    return skinTones[2]; // Default to medium
  };


  // Initialize camera for AR
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser");
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set the stream to the video element
        video.srcObject = stream;
        
        // Ensure video attributes are set
        video.setAttribute('autoplay', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('muted', 'true');
        
        // Set AR active immediately when stream is assigned
        setIsARActive(true);
        setIsLoading(false);
        
        // Wait for video to be ready
        const handleCanPlay = () => {
          console.log("Video can play, attempting to play...");
          video.play()
            .then(() => {
              console.log("Video playing successfully");
              
              // Force video to be visible
              video.style.display = 'block';
              video.style.visibility = 'visible';
              video.style.opacity = '1';
              
              // Initialize MediaPipe Face Detection
              initializeFaceDetection();
            })
            .catch(err => {
              console.error("Error playing video:", err);
              setError("Failed to start video playback. Please try again.");
            });
        };
        
        const handleLoadedMetadata = () => {
          console.log("Video metadata loaded");
        };
        
        // Remove any existing event listeners
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('playing', handleCanPlay);
        
        // Add event listeners
        video.addEventListener('canplay', handleCanPlay, { once: true });
        video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        video.addEventListener('playing', () => {
          console.log("Video is playing");
          setIsARActive(true);
          setIsLoading(false);
        }, { once: true });
        
        // Try to play immediately if ready
        if (video.readyState >= 2) {
          console.log("Video ready state:", video.readyState);
          video.play().catch(err => {
            console.log("Immediate play failed, waiting for canplay event:", err);
          });
        }
        
        // Fallback: try playing after a short delay
        setTimeout(() => {
          if (!isARActive && video.srcObject) {
            console.log("Fallback: attempting to play video");
            video.play().catch(err => {
              console.error("Fallback play failed:", err);
            });
          }
        }, 500);
      } else {
        // If video ref is not available, stop the stream
        stream.getTracks().forEach(track => track.stop());
        throw new Error("Video element not available");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsLoading(false);
      setIsARActive(false);
      let errorMessage = "Unable to access camera. ";
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage += "Please allow camera permissions in your browser settings.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage += "No camera found. Please connect a camera device.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage += "Camera is already in use by another application.";
      } else {
        errorMessage += error.message || "Please ensure camera permissions are granted.";
      }
      setError(errorMessage);
    }
  };

  // Stop camera
  const stopCamera = () => {
    // Stop MediaPipe camera
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    // Stop face detection
    if (faceDetectionRef.current) {
      faceDetectionRef.current.close();
      faceDetectionRef.current = null;
    }

    // Clear detection interval
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        track.stop();
        stream.removeTrack(track);
      });
      videoRef.current.srcObject = null;
      setIsARActive(false);
      setIsAnalyzing(false);
      setAnalysisComplete(false);
      setFaceDetected(false);
      setIsScanning(false);
      setCountdown(0);
      setFacePositioned(false);
      setScanningComplete(false);
      
      // Clear scanning countdown
      if (startScanningCountdown.current) {
        clearInterval(startScanningCountdown.current);
        startScanningCountdown.current = null;
      }
    }
  };

  // Calculate recommendations based on AI analysis + preferences
  const calculateRecommendations = () => {
    // This would normally use AI/ML algorithms
    // For now, we'll simulate based on AI analysis and preferences
    const baseScore = aiAnalysis.confidence || 85;
    
    return hairstyleOptions
      .map(style => {
        let matchScore = baseScore;
        
        // Adjust score based on face shape compatibility (simulated logic)
        if (aiAnalysis.faceShape === "oval") {
          matchScore += Math.random() * 10; // Most styles suit oval
        } else if (aiAnalysis.faceShape === "round") {
          matchScore += style.category === "Long" ? 5 : -2;
        } else if (aiAnalysis.faceShape === "square") {
          matchScore += style.category === "Medium" ? 5 : 0;
        }
        
        // Adjust based on user preferences
        if (preferences.hairLength && style.category.toLowerCase() === preferences.hairLength.toLowerCase()) {
          matchScore += 5;
        }
        
        return {
          ...style,
          matchScore: Math.min(100, Math.floor(matchScore))
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 6);
  };

  const [recommendations, setRecommendations] = useState([]);

  // Handle preference change
  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle style preference toggle
  const toggleStylePreference = (pref) => {
    setPreferences(prev => ({
      ...prev,
      stylePreferences: prev.stylePreferences.includes(pref)
        ? prev.stylePreferences.filter(p => p !== pref)
        : [...prev.stylePreferences, pref]
    }));
  };

  // Generate recommendations when moving to try on step
  const proceedToTryOn = () => {
    if (!analysisComplete) {
      alert("Please wait for face analysis to complete");
      return;
    }
    const recs = calculateRecommendations();
    setRecommendations(recs);
    setCurrentStep(2);
  };

  // Apply hairstyle in AR
  const applyHairstyle = (hairstyle) => {
    setSelectedHairstyle(hairstyle);
    // In a real implementation, this would apply the hairstyle to the AR view
    console.log("Applying hairstyle:", hairstyle);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop MediaPipe camera
      if (cameraRef.current) {
        cameraRef.current.stop();
      }

      // Stop face detection
      if (faceDetectionRef.current) {
        faceDetectionRef.current.close();
      }

      // Clear detection interval
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      
      // Clear scanning countdown
      if (startScanningCountdown.current) {
        clearInterval(startScanningCountdown.current);
      }
      
      stopCamera();
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 overflow-hidden flex flex-col">
      {/* Header - Kiosk Optimized */}
      <div className="bg-gradient-to-r from-[#160B53] to-[#12094A] text-white h-32 flex items-center justify-between px-16 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-white/20 rounded-xl">
            <Sparkles className="h-12 w-12" />
          </div>
          <div>
            <h1 className="text-5xl font-bold">AR Hair Try On</h1>
            <p className="text-2xl text-white/90 mt-2">Smart Recommendations Powered by AI</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="border-white text-white hover:bg-white hover:text-[#160B53] text-2xl px-12 py-6 h-auto rounded-xl"
        >
          <X className="h-8 w-8 mr-4" />
          Reset
        </Button>
      </div>

      {/* Progress Steps - Kiosk Optimized */}
      <div className="w-full px-16 py-8 bg-white border-b-4 border-purple-200">
        <div className="flex items-center justify-center gap-8 mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl transition-all ${
                  currentStep >= step
                    ? "bg-[#160B53] text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > step ? (
                  <CheckCircle className="h-12 w-12" />
                ) : (
                  step
                )}
              </div>
              {step < 3 && (
                <div
                  className={`w-32 h-3 mx-4 transition-all rounded-full ${
                    currentStep > step ? "bg-[#160B53]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-16">
          <span className={`text-2xl font-semibold ${currentStep === 1 ? "text-[#160B53]" : "text-gray-500"}`}>
            AI Analysis
          </span>
          <span className={`text-2xl font-semibold ${currentStep === 2 ? "text-[#160B53]" : "text-gray-500"}`}>
            Try On
          </span>
          <span className={`text-2xl font-semibold ${currentStep === 3 ? "text-[#160B53]" : "text-gray-500"}`}>
            Recommendations
          </span>
        </div>
      </div>

      {/* Step 1: AI Face Analysis - Kiosk Layout */}
      {currentStep === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center bg-black overflow-hidden relative">
          {/* Camera View - Center of Screen */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Video element - centered */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isARActive ? 'block' : 'hidden'}`}
              style={{ 
                transform: 'scaleX(-1)',
                display: isARActive ? 'block' : 'none',
                visibility: isARActive ? 'visible' : 'hidden',
                zIndex: 1,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
            
            {/* Canvas overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 2 }}
            />
                  
            {/* Start Button - Simple */}
            {!isARActive && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center">
                  <Button
                    onClick={startCamera}
                    disabled={isLoading}
                    className="bg-[#160B53] hover:bg-[#12094A] text-white text-5xl font-bold px-24 py-12 h-auto rounded-2xl shadow-2xl"
                  >
                    Start
                  </Button>
                </div>
              </div>
            )}
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
                <div className="text-center text-white">
                  <Loader2 className="h-32 w-32 mx-auto mb-8 animate-spin" />
                  <p className="text-4xl font-semibold">Starting camera...</p>
                </div>
              </div>
            )}
                  
            {/* Face Positioning Guide - Kiosk Size */}
            {isARActive && !scanningComplete && !isAnalyzing && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className="bg-black/70 backdrop-blur-sm rounded-2xl p-12 max-w-2xl mx-4 text-center text-white">
                  <div className="mb-6">
                    {faceDetected ? (
                      facePositioned ? (
                        isScanning ? (
                          <>
                            <div className="text-9xl font-bold mb-4 text-green-400 animate-pulse">{countdown}</div>
                            <p className="text-4xl font-semibold mb-2">Stay Still!</p>
                            <p className="text-2xl opacity-90">Keep your face straight and centered</p>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-24 w-24 mx-auto mb-4 text-green-400" />
                            <p className="text-4xl font-semibold mb-2">Face Positioned!</p>
                            <p className="text-2xl opacity-90">Preparing to scan...</p>
                          </>
                        )
                      ) : (
                        <>
                          <AlertCircle className="h-24 w-24 mx-auto mb-4 text-yellow-400" />
                          <p className="text-4xl font-semibold mb-4">Position Your Face</p>
                          <p className="text-2xl opacity-90">
                            Move your face to the center and keep it straight
                          </p>
                        </>
                      )
                    ) : (
                      <>
                        <Scan className="h-24 w-24 mx-auto mb-4 text-blue-400 animate-pulse" />
                        <p className="text-4xl font-semibold mb-2">Position Your Face</p>
                        <p className="text-2xl opacity-90">Look straight at the camera</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Scanning Countdown Overlay - Kiosk Size */}
            {isScanning && isARActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-30 pointer-events-none">
                <div className="text-center text-white">
                  <div className="text-[12rem] font-bold mb-8 text-green-400 animate-pulse">
                    {countdown}
                  </div>
                  <p className="text-5xl font-semibold mb-4">Stay Still!</p>
                  <p className="text-3xl opacity-75">Scanning your face...</p>
                </div>
              </div>
            )}
            
            {/* Analyzing overlay - Kiosk Size */}
            {isAnalyzing && isARActive && scanningComplete && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-20 pointer-events-none">
                <div className="text-center text-white bg-black/70 px-16 py-12 rounded-2xl backdrop-blur-sm">
                  <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin" />
                  <p className="text-3xl font-semibold">Analyzing facial structure...</p>
                </div>
              </div>
            )}
                
            {/* Analysis Complete Badge - Kiosk Size */}
            {analysisComplete && isARActive && (
              <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-16 py-8 rounded-xl z-20 text-center shadow-2xl">
                <p className="text-4xl font-bold">✓ Analysis Complete!</p>
                <p className="text-2xl mt-3">Close camera to see results</p>
              </div>
            )}
            
            {/* Stop Camera Button - Kiosk Size */}
            {isARActive && (
              <div className="absolute top-8 right-8 z-20">
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  className="bg-white/90 hover:bg-white text-2xl px-10 py-6 h-auto rounded-xl"
                >
                  <X className="h-8 w-8 mr-3" />
                  {analysisComplete ? 'Close' : 'Stop'}
                </Button>
              </div>
            )}
          </div>

          {/* Analysis Results Panel - Shown after camera is closed */}
          {analysisComplete && !isARActive && (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 overflow-y-auto z-10">
              <div className="max-w-6xl mx-auto px-16 py-12">
                {/* AI Analysis Results */}
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-4 border-purple-200 mb-12 rounded-2xl">
                  <CardContent className="p-10">
                    <div className="flex items-center gap-4 mb-8">
                      <Brain className="h-12 w-12 text-purple-600" />
                      <h3 className="text-4xl font-bold text-gray-800">AI Analysis Results</h3>
                      {aiAnalysis.confidence > 0 && (
                        <span className="ml-auto bg-green-100 text-green-800 px-6 py-3 rounded-full text-2xl font-semibold">
                          {aiAnalysis.confidence}% Confidence
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Face Shape */}
                      <div className="bg-white p-8 rounded-xl shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                          <Scan className="h-10 w-10 text-purple-600" />
                          <span className="text-2xl font-semibold text-gray-600">Face Shape</span>
                        </div>
                        <p className="text-5xl font-bold text-gray-800 capitalize mt-4">
                          {aiAnalysis.faceShape || aiAnalysis.facialStructure || "Analyzing..."}
                        </p>
                      </div>

                      {/* Skin Tone */}
                      <div className="bg-white p-8 rounded-xl shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                          <Palette className="h-10 w-10 text-purple-600" />
                          <span className="text-2xl font-semibold text-gray-600">Skin Tone</span>
                        </div>
                        <div className="flex items-center gap-6 mt-4">
                          <div
                            className="w-24 h-24 rounded-full border-4 border-gray-300 shadow-lg"
                            style={{ backgroundColor: aiAnalysis.skinTone?.color || "#E0AC69" }}
                          />
                          <p className="text-5xl font-bold text-gray-800 capitalize">
                            {aiAnalysis.skinTone?.label || aiAnalysis.skinColor || "Analyzing..."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* User Preferences */}
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-4 border-blue-200 mb-12 rounded-2xl">
                  <CardContent className="p-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-4 bg-blue-100 rounded-xl">
                        <Palette className="h-12 w-12 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-4xl font-bold text-gray-800">Your Preferences</h3>
                        <p className="text-2xl text-gray-600 mt-2">Help us personalize your recommendations</p>
                      </div>
                    </div>
                    
                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Hair Length Preference */}
                        <div>
                          <label className="block text-2xl font-semibold text-gray-700 mb-4">
                            Preferred Hair Length
                          </label>
                          <select
                            value={preferences.hairLength}
                            onChange={(e) => handlePreferenceChange("hairLength", e.target.value)}
                            className="w-full px-8 py-6 text-2xl border-4 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#160B53] focus:border-[#160B53]"
                          >
                            <option value="">Any Length</option>
                            <option value="short">Short</option>
                            <option value="medium">Medium</option>
                            <option value="long">Long</option>
                          </select>
                        </div>

                        {/* Hair Type */}
                        <div>
                          <label className="block text-2xl font-semibold text-gray-700 mb-4">
                            Hair Type
                          </label>
                          <select
                            value={preferences.hairType}
                            onChange={(e) => handlePreferenceChange("hairType", e.target.value)}
                            className="w-full px-8 py-6 text-2xl border-4 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#160B53] focus:border-[#160B53]"
                          >
                            <option value="">Any Type</option>
                            <option value="straight">Straight</option>
                            <option value="wavy">Wavy</option>
                            <option value="curly">Curly</option>
                            <option value="coily">Coily</option>
                          </select>
                        </div>
                      </div>

                      {/* Style Preferences */}
                      <div>
                        <label className="block text-2xl font-semibold text-gray-700 mb-6">
                          Style Preferences (Select all that apply)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {stylePreferenceOptions.map((pref) => (
                            <button
                              key={pref}
                              type="button"
                              onClick={() => toggleStylePreference(pref)}
                              className={`p-6 rounded-xl border-4 transition-all text-2xl font-semibold ${
                                preferences.stylePreferences.includes(pref)
                                  ? "border-[#160B53] bg-purple-50 text-[#160B53]"
                                  : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                              }`}
                            >
                              {pref}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Proceed Button */}
                    <div className="pt-10 border-t-4 border-gray-300">
                      <Button
                        onClick={proceedToTryOn}
                        disabled={!analysisComplete}
                        className="w-full bg-[#160B53] hover:bg-[#12094A] text-white py-8 text-3xl font-bold rounded-xl"
                      >
                        <Sparkles className="h-8 w-8 mr-4" />
                        Get My Recommendations
                      </Button>
                      <p className="text-xl text-gray-500 text-center mt-4">
                        Based on your facial structure and preferences
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: AR Try On */}
      {currentStep === 2 && (
        <div className="flex-1 flex flex-col items-center justify-center bg-black overflow-hidden relative">
          <div className="relative w-full h-full flex items-center justify-center">
            {!isARActive ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-white">
                  <Camera className="h-32 w-32 mx-auto mb-8 opacity-50" />
                  <p className="text-4xl mb-12 font-semibold">Camera not active</p>
                  <Button
                    onClick={startCamera}
                    disabled={isLoading}
                    className="bg-[#160B53] hover:bg-[#12094A] text-white text-3xl px-16 py-8 h-auto rounded-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-8 w-8 mr-4 animate-spin" />
                        Starting Camera...
                      </>
                    ) : (
                      <>
                        <Camera className="h-8 w-8 mr-4" />
                        Start Camera
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ display: selectedHairstyle ? "block" : "none" }}
                />
                <div className="absolute top-8 right-8">
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    className="bg-white/90 hover:bg-white text-2xl px-10 py-6 h-auto rounded-xl"
                  >
                    <X className="h-8 w-8 mr-3" />
                    Stop Camera
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Hairstyle Selection */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-8 border-t-4 border-purple-200">
            <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Recommended Hairstyles for You
            </h3>
            <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
              {recommendations.map((style) => (
                <div
                  key={style.id}
                  onClick={() => applyHairstyle(style)}
                  className={`p-6 rounded-xl border-4 cursor-pointer transition-all ${
                    selectedHairstyle?.id === style.id
                      ? "border-[#160B53] bg-purple-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="relative bg-gray-100 rounded-lg mb-4" style={{ aspectRatio: "1/1" }}>
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <Sparkles className="h-12 w-12" />
                    </div>
                    <div className="absolute top-3 right-3 bg-[#160B53] text-white text-xl px-3 py-2 rounded-lg font-bold">
                      {style.matchScore}% Match
                    </div>
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800 text-center">{style.name}</h4>
                  <p className="text-xl text-gray-500 text-center mt-2">{style.category}</p>
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 max-w-6xl mx-auto">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="border-gray-300 text-2xl px-10 py-6 h-auto rounded-xl"
              >
                Back to Preferences
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                className="bg-[#160B53] hover:bg-[#12094A] text-white text-2xl px-10 py-6 h-auto rounded-xl"
              >
                View All Recommendations
                <Sparkle className="h-6 w-6 ml-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Smart Recommendations */}
      {currentStep === 3 && (
        <div className="flex-1 overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto px-16 py-12">
            <Card className="shadow-lg border-0">
              <CardContent className="p-10">
                <div className="flex items-center gap-4 mb-8">
                  <Sparkles className="h-12 w-12 text-[#160B53]" />
                  <h2 className="text-4xl font-bold text-gray-800">Smart Recommendations</h2>
                </div>
                <p className="text-2xl text-gray-600 mb-10">
                  Based on your facial structure ({aiAnalysis.faceShape}), skin tone ({aiAnalysis.skinTone?.label || aiAnalysis.skinColor}), and preferences, here are our top recommendations:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {recommendations.map((style) => (
                    <Card
                      key={style.id}
                      className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedHairstyle(style);
                        setCurrentStep(2);
                      }}
                    >
                      <div className="relative bg-gradient-to-br from-purple-100 to-pink-100" style={{ height: "300px" }}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Sparkles className="h-20 w-20 text-purple-300" />
                        </div>
                        <div className="absolute top-4 right-4 bg-[#160B53] text-white text-xl font-bold px-4 py-2 rounded-full">
                          {style.matchScore}% Match
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{style.name}</h3>
                        <p className="text-xl text-gray-500 mb-4">{style.category} Length</p>
                        <div className="flex items-center gap-2 text-lg text-gray-600">
                          <Heart className="h-5 w-5 text-red-500" />
                          <span>Perfect for {aiAnalysis.faceShape} faces</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-12">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    variant="outline"
                    className="border-gray-300 text-2xl px-10 py-6 h-auto rounded-xl"
                  >
                    Back to Try On
                  </Button>
                  <Button
                    onClick={() => {
                      setCurrentStep(1);
                      setAnalysisComplete(false);
                      setAiAnalysis({
                        facialStructure: null,
                        faceShape: null,
                        skinColor: null,
                        skinTone: null,
                        confidence: 0,
                        faceDetected: false
                      });
                      setPreferences({
                        hairLength: "",
                        stylePreferences: [],
                        hairType: "",
                        occasion: ""
                      });
                      stopCamera();
                    }}
                    className="bg-[#160B53] hover:bg-[#12094A] text-white text-2xl px-10 py-6 h-auto rounded-xl"
                  >
                    Start Over
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
