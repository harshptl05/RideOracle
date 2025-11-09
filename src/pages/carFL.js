import React, { useState, useEffect } from "react";
import { Card, CardContent, Button, Input, Label, Alert, AlertDescription, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/Components.tsx";
import { MessageSquare, Send, X } from "lucide-react";

const EnhancedCalculator = () => {
  const [calculatorType, setCalculatorType] = useState("finance");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [filteredCar, setFilteredCar] = useState(null);
  const [financialInfo, setFinancialInfo] = useState({
    monthlyIncome: 0,
    mortgagePayment: 0,
    otherDebts: 0,
    creditScore: 650,
  });
  const [vehicleInfo, setVehicleInfo] = useState({
    price: 45000,
    downPayment: 5000,
    term: 72,
    apr: 2.99,
    mileageAllowance: 12000,
    residualValue: 60,
  });
  const [payment, setPayment] = useState(null);
  const [aiAdvice, setAiAdvice] = useState(null);

  useEffect(() => {
    debugger;
    const params = new URLSearchParams(window.location.search);
    const skuId = params.get('id');
    if (skuId) {
      const cars = localStorage.getItem("filterVechiles");
      if (cars) {
        try {
          const parsedCars = JSON.parse(cars);
          const car = parsedCars.find(x => Number(x.SKU_ID) === Number(skuId));
          if (car) {
            setFilteredCar(car);
            //setVehicleInfo(prev => ({...prev, price: car.price || prev.price}));
          }
        } catch (error) {
          console.error('Error parsing cars data:', error);
        }
      }
    }
  }, []);

  const calculateFinancing = () => {
    const loanAmount = filteredCar.Starting_Price - vehicleInfo.downPayment;
    const monthlyRate = vehicleInfo.apr / 100 / 12;
    const monthlyPayment = (loanAmount * monthlyRate) / 
                          (1 - Math.pow(1 + monthlyRate, -vehicleInfo.term));
    analyzePayment(monthlyPayment);
  };

  const calculateLease = () => {
    const residualAmount = (filteredCar.Starting_Price * vehicleInfo.residualValue) / 100;
    const depreciation = (filteredCar.Starting_Price - residualAmount) / vehicleInfo.term;
    const monthlyRate = vehicleInfo.apr / 100 / 12;
    const financeFee = (filteredCar.Starting_Price + residualAmount) * monthlyRate;
    const monthlyPayment = depreciation + financeFee;
    analyzePayment(monthlyPayment);
  };

  const analyzePayment = (monthlyPayment) => {
    setPayment(monthlyPayment.toFixed(2));
    const newDTI = (monthlyPayment + financialInfo.mortgagePayment + 
                   financialInfo.otherDebts) / (financialInfo.monthlyIncome || 1);
    setAiAdvice(generateAIAdvice(newDTI, calculatorType));
  };

  const generateAIAdvice = (dti, type) => {
    if (!financialInfo.monthlyIncome) return "Please enter your monthly income for personalized advice.";
    
    let advice = "";
    if (dti > 0.43) {
      advice = `This ${type} payment would put your debt-to-income ratio above recommended levels.`;
    } else if (dti > 0.36) {
      advice = `While this ${type} payment is possible, consider increasing your down payment.`;
    } else {
      advice = `This ${type} payment appears manageable based on your financial situation.`;
    }
    if (type === "lease") {
      advice += ` Consider if the ${vehicleInfo.mileageAllowance} annual mileage allowance suits your needs.`;
    }
    return advice;
  };

  const handleChatSubmit = () => {
    if (!currentMessage.trim()) return;
    const userMessage = { type: "user", content: currentMessage };
    const aiResponse = { type: "ai", content: generateChatResponse(currentMessage) };
    setMessages([...messages, userMessage, aiResponse]);
    setCurrentMessage("");
  };

  const generateChatResponse = (question) => {
    const responses = {
      lease: "Leasing typically offers lower monthly payments but includes mileage restrictions and you won't own the vehicle.",
      finance: "Financing allows you to own the vehicle and build equity, though monthly payments are usually higher than leasing.",
      credit: "Higher credit scores typically qualify you for better interest rates. We recommend a score of 660+ for optimal rates.",
      downpayment: "A larger down payment reduces your monthly payments and may help you qualify for better rates.",
    };
    
    const lowerQuestion = question.toLowerCase();
    for (const [key, response] of Object.entries(responses)) {
      if (lowerQuestion.includes(key)) return response;
    }
    return "Please ask about leasing, financing, credit requirements, or down payments. I'm here to help!";
  };

  if (!filteredCar) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-r from-red-600 to-red-900 flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/2 p-4 flex justify-center items-center">
        <img
          src={`/CarImages/${filteredCar.SKU_ID}.png`}
          alt="Vehicle"
          className="w-full max-w-xl rounded-lg shadow-lg"
        />
      </div>

      <div className="w-full lg:w-1/2 p-4 flex justify-center items-center">
        <Card className="w-full max-w-lg text-black bg-white shadow-2xl rounded-3xl">
          <Tabs defaultValue="finance" onValueChange={setCalculatorType}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="finance">Finance</TabsTrigger>
              <TabsTrigger value="lease">Lease</TabsTrigger>
            </TabsList>

            <CardContent className="space-y-4 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Monthly Income ($)</Label>
                  <Input
                    type="number"
                    value={financialInfo.monthlyIncome}
                    onChange={(e) => setFinancialInfo({...financialInfo, monthlyIncome: Number(e.target.value)})}
                    className="mt-1 border-red-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Mortgage Payment ($)</Label>
                  <Input
                    type="number"
                    value={financialInfo.mortgagePayment}
                    onChange={(e) => setFinancialInfo({...financialInfo, mortgagePayment: Number(e.target.value)})}
                    className="mt-1 border-red-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Vehicle Price ($)</Label>
                  <Input
                    type="number"
                    value={filteredCar.Starting_Price}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, price: Number(e.target.value)})}
                    className="mt-1 border-red-500"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Down Payment ($)</Label>
                  <Input
                    type="number"
                    value={vehicleInfo.downPayment}
                    onChange={(e) => setVehicleInfo({...vehicleInfo, downPayment: Number(e.target.value)})}
                    className="mt-1 border-red-500"
                  />
                </div>
                {calculatorType === "lease" && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Annual Mileage</Label>
                    <Input
                      type="number"
                      value={vehicleInfo.mileageAllowance}
                      onChange={(e) => setVehicleInfo({...vehicleInfo, mileageAllowance: Number(e.target.value)})}
                      className="mt-1 border-red-500"
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={calculatorType === "finance" ? calculateFinancing : calculateLease}
                className="w-full bg-red-600 hover:bg-red-700 mt-4"
              >
                Calculate {calculatorType === "finance" ? "Financing" : "Lease"}
              </Button>

              {payment && (
                <div className="mt-4 text-center bg-red-100 p-4 rounded-xl">
                  <p className="text-2xl font-bold text-red-600">${payment}/month</p>
                  {aiAdvice && (
                    <Alert className="mt-2">
                      <AlertDescription>{aiAdvice}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Tabs>
        </Card>
      </div>

      <div className="fixed bottom-4 left-4 z-50">
        {!chatOpen ? (
          <Button
            onClick={() => setChatOpen(true)}
            className="rounded-full w-12 h-12 md:w-16 md:h-16 bg-red-600 hover:bg-red-700 flex items-center justify-center"
          >
            <MessageSquare className="w-6 h-6 md:w-8 md:h-8" />
          </Button>
        ) : (
          <div className="w-80 md:w-96 h-96 bg-white rounded-lg shadow-xl flex flex-col">
            <div className="p-4 bg-red-600 text-white rounded-t-lg flex justify-between items-center">
              <span>Finance Assistant</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatOpen(false)}
                className="hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      msg.type === "user" ? "bg-red-600 text-black" : "bg-black"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
                placeholder="Ask about financing..."
                className="flex-1"
              />
              <Button onClick={handleChatSubmit} className="bg-red-600 hover:bg-red-700">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedCalculator;