"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { CardComponent as Card, Button, CardContent, CardHeader } from '@/components/ui';

const cars = [
  { 
    id: 1, 
    name: "Tesla Model 3", 
    price: 40990, 
    doors: 4, 
    fuelEconomy: 132, 
    image: "/CarImages/1.png",
    details: "The Tesla Model 3 is an all-electric sedan known for its minimalist design and cutting-edge technology.",
    model_year: 2024,
    local_mpg: 138,
    highway_mpg: 126,
    fuel_type: "Electric",
    car_engine: "Dual Motor AWD",
    color: "Pearl White",
    vehicle_type: "Electric Sedan"
  },
  { 
    id: 2, 
    name: "Toyota Camry", 
    price: 26420, 
    doors: 4, 
    fuelEconomy: 32, 
    image: "/CarImages/2.png",
    details: "The Toyota Camry offers a perfect blend of comfort, reliability, and fuel efficiency.",
    model_year: 2024,
    local_mpg: 28,
    highway_mpg: 39,
    fuel_type: "Gasoline",
    car_engine: "2.5L 4-Cylinder",
    color: "Midnight Black",
    vehicle_type: "Sedan"
  },
  { 
    id: 3, 
    name: "Honda CR-V", 
    price: 29500, 
    doors: 4, 
    fuelEconomy: 30, 
    image: "/CarImages/3.png",
    details: "The Honda CR-V is a versatile SUV with ample cargo space and advanced safety features.",
    model_year: 2024,
    local_mpg: 28,
    highway_mpg: 34,
    fuel_type: "Gasoline",
    car_engine: "1.5L Turbo",
    color: "Sonic Gray",
    vehicle_type: "SUV"
  },
  { 
    id: 4, 
    name: "Ford Mustang", 
    price: 32515, 
    doors: 2, 
    fuelEconomy: 25, 
    image: "/CarImages/4.png",
    details: "The Ford Mustang delivers exhilarating performance with iconic muscle car styling.",
    model_year: 2024,
    local_mpg: 22,
    highway_mpg: 32,
    fuel_type: "Premium Gasoline",
    car_engine: "2.3L EcoBoost",
    color: "Race Red",
    vehicle_type: "Sports Car"
  },
  { 
    id: 5, 
    name: "BMW 3 Series", 
    price: 45000, 
    doors: 4, 
    fuelEconomy: 28, 
    image: "/CarImages/5.png",
    details: "The BMW 3 Series combines luxury with dynamic driving performance.",
    model_year: 2024,
    local_mpg: 26,
    highway_mpg: 36,
    fuel_type: "Premium Gasoline",
    car_engine: "2.0L TwinPower Turbo",
    color: "Alpine White",
    vehicle_type: "Luxury Sedan"
  },
  { 
    id: 6, 
    name: "Toyota Prius", 
    price: 27950, 
    doors: 4, 
    fuelEconomy: 57, 
    image: "/CarImages/6.png",
    details: "The Toyota Prius is a hybrid pioneer offering exceptional fuel economy and reliability.",
    model_year: 2024,
    local_mpg: 58,
    highway_mpg: 56,
    fuel_type: "Hybrid",
    car_engine: "1.8L 4-Cylinder Hybrid",
    color: "Electric Storm Blue",
    vehicle_type: "Hybrid Sedan"
  },
  {
    id: 7,
    name: "Chevrolet Bolt EV",
    price: 26500,
    doors: 4,
    fuelEconomy: 120,
    image: "/CarImages/7.png",
    details: "The Chevrolet Bolt EV offers impressive range and practicality in an affordable electric package.",
    model_year: 2024,
    local_mpg: 131,
    highway_mpg: 109,
    fuel_type: "Electric",
    car_engine: "Single Motor FWD",
    color: "Bright Blue Metallic",
    vehicle_type: "Electric Hatchback"
  },
  {
    id: 8,
    name: "Jeep Grand Cherokee",
    price: 41035,
    doors: 4,
    fuelEconomy: 26,
    image: "/CarImages/8.png",
    details: "The Jeep Grand Cherokee combines luxury with legendary off-road capability.",
    model_year: 2024,
    local_mpg: 19,
    highway_mpg: 26,
    fuel_type: "Gasoline",
    car_engine: "3.6L V6",
    color: "Diamond Black",
    vehicle_type: "SUV"
  },
  {
    id: 9,
    name: "Hyundai Tucson Hybrid",
    price: 32350,
    doors: 4,
    fuelEconomy: 38,
    image: "/CarImages/9.png",
    details: "The Hyundai Tucson Hybrid offers excellent fuel efficiency with modern styling and features.",
    model_year: 2024,
    local_mpg: 38,
    highway_mpg: 38,
    fuel_type: "Hybrid",
    car_engine: "1.6L Turbo Hybrid",
    color: "Amazon Gray",
    vehicle_type: "Hybrid SUV"
  },
  {
    id: 10,
    name: "Porsche 911",
    price: 106100,
    doors: 2,
    fuelEconomy: 20,
    image: "/CarImages/10.png",
    details: "The Porsche 911 continues its legacy as the benchmark for sports car performance and refinement.",
    model_year: 2024,
    local_mpg: 18,
    highway_mpg: 25,
    fuel_type: "Premium Gasoline",
    car_engine: "3.0L Twin-Turbo Flat-6",
    color: "Guards Red",
    vehicle_type: "Sports Car"
  },
  {
    id: 11,
    name: "Lexus ES Hybrid",
    price: 43690,
    doors: 4,
    fuelEconomy: 44,
    image: "/CarImages/11.png",
    details: "The Lexus ES Hybrid delivers luxury comfort with impressive fuel efficiency.",
    model_year: 2024,
    local_mpg: 43,
    highway_mpg: 44,
    fuel_type: "Hybrid",
    car_engine: "2.5L 4-Cylinder Hybrid",
    color: "Atomic Silver",
    vehicle_type: "Luxury Hybrid Sedan"
  },
  {
    id: 12,
    name: "Ford F-150 Lightning",
    price: 49995,
    doors: 4,
    fuelEconomy: 78,
    image: "/CarImages/12.png",
    details: "The Ford F-150 Lightning brings electric capability to America's best-selling pickup truck.",
    model_year: 2024,
    local_mpg: 76,
    highway_mpg: 61,
    fuel_type: "Electric",
    car_engine: "Dual Motor AWD",
    color: "Antimatter Blue",
    vehicle_type: "Electric Pickup"
  },
  {
    id: 13,
    name: "Audi Q5",
    price: 43500,
    doors: 4,
    fuelEconomy: 25,
    image: "/CarImages/13.png",
    details: "The Audi Q5 offers refined luxury and performance in a practical SUV package.",
    model_year: 2024,
    local_mpg: 23,
    highway_mpg: 28,
    fuel_type: "Premium Gasoline",
    car_engine: "2.0L Turbo",
    color: "Navarra Blue",
    vehicle_type: "Luxury SUV"
  },
  {
    id: 14,
    name: "Kia EV6",
    price: 42600,
    doors: 4,
    fuelEconomy: 117,
    image: "/CarImages/14.png",
    details: "The Kia EV6 combines bold styling with advanced electric technology and fast charging capability.",
    model_year: 2024,
    local_mpg: 116,
    highway_mpg: 94,
    fuel_type: "Electric",
    car_engine: "Dual Motor AWD",
    color: "Glacier White",
    vehicle_type: "Electric Crossover"
  },
  {
    id: 15,
    name: "Volkswagen GTI",
    price: 30530,
    doors: 4,
    fuelEconomy: 28,
    image: "/CarImages/15.png",
    details: "The Volkswagen GTI continues its hot hatch legacy with perfect balance of performance and practicality.",
    model_year: 2024,
    local_mpg: 24,
    highway_mpg: 34,
    fuel_type: "Premium Gasoline",
    car_engine: "2.0L Turbo",
    color: "Kings Red",
    vehicle_type: "Hot Hatchback"
  },
];

function calculateMatch(car, filters) {
  let match = 100;
  if (filters.price && car.price > filters.price) match -= 20;
  if (filters.doors && car.doors !== filters.doors) match -= 30;
  if (filters.fuelEconomy && car.fuelEconomy < filters.fuelEconomy) match -= 20;
  return match;
}

const CompareCard = ({ car, onRemove }) => (
  <Card className="shadow-lg bg-white rounded-lg border-2 border-red-200">
    <CardContent>
      <img src={car.image} alt={car.name} className="w-full h-40 object-contain bg-gray-100 rounded-t-lg mb-4" />
      <h3 className="text-lg font-bold mb-2 text-red-900">{car.name}</h3>
      
      <div className="space-y-2 text-sm">
        <p className="text-red-800"><span className="font-semibold">Model Year:</span> {car.model_year}</p>
        <p className="text-red-800"><span className="font-semibold">Starting Price:</span> ${car.price.toLocaleString()}</p>
        <p className="text-red-800"><span className="font-semibold">Local MPG:</span> {car.local_mpg}</p>
        <p className="text-red-800"><span className="font-semibold">Highway MPG:</span> {car.highway_mpg}</p>
        <p className="text-red-800"><span className="font-semibold">Fuel Type:</span> {car.fuel_type}</p>
        <p className="text-red-800"><span className="font-semibold">Engine:</span> {car.car_engine}</p>
        <p className="text-red-800"><span className="font-semibold">Color:</span> {car.color}</p>
        <p className="text-red-800"><span className="font-semibold">Vehicle Type:</span> {car.vehicle_type}</p>
      </div>

      <div className="flex space-x-2 mt-4">
        <Button 
          className="bg-red-600 hover:bg-red-700 text-white" 
          onClick={onRemove}
        >
          Remove
        </Button>
        <Button 
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={() => window.location.href = '/carF'}
        >
          Select Vehicle
        </Button>
      </div>
    </CardContent>
  </Card>
);

const CarMatch = () => {
  const [filters, setFilters] = useState({ price: null, doors: null, fuelEconomy: null });
  const [showDetails, setShowDetails] = useState(null);
  const [compare, setCompare] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [showCompareView, setShowCompareView] = useState(false);

  const filteredCars = cars
    .map((car) => ({ ...car, match: calculateMatch(car, filters) }))
    .sort((a, b) => b.match - a.match);

  const handleCompare = (car) => {
    setCompare((prev) => {
      if (prev.includes(car.id)) {
        return prev.filter((id) => id !== car.id);
      } else if (prev.length < 3) {
        return [...prev, car.id];
      }
      return prev;
    });
  };

  const handleSelectVehicle = (carId) => {
    window.location.href = `/vehicle/${carId}`;
  };

  return (
    <div className="p-4 bg-red-50 min-h-screen text-red-900">
      <nav className="flex justify-between items-center bg-red-800 text-white p-4 mb-6 rounded-lg shadow-md">
        <div className="font-bold text-xl">Car Match System</div>
        <div className="space-x-4">
          <Button
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            onClick={() => setShowCompareView(!showCompareView)}
          >
            Compare ({compare.length})
          </Button>
        </div>
      </nav>

      <div className="mb-6 p-4 bg-white rounded-lg shadow-md border-2 border-red-200">
        <h2 className="text-lg font-bold mb-4 text-red-800">Filters</h2>
        <div className="flex space-x-4">
          <input
            type="number"
            placeholder="Max Price"
            className="border-2 border-red-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-red-500 focus:outline-none"
            onChange={(e) => setFilters({ ...filters, price: +e.target.value })}
          />
          <input
            type="number"
            placeholder="Number of Doors"
            className="border-2 border-red-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-red-500 focus:outline-none"
            onChange={(e) => setFilters({ ...filters, doors: +e.target.value })}
          />
          <input
            type="number"
            placeholder="Min Fuel Economy"
            className="border-2 border-red-300 p-2 rounded-lg w-full focus:ring-2 focus:ring-red-500 focus:outline-none"
            onChange={(e) => setFilters({ ...filters, fuelEconomy: +e.target.value })}
          />
        </div>
      </div>

      {showCompareView && compare.length > 0 && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="fixed top-0 left-0 w-full h-full bg-red-50 z-50 p-4 overflow-y-auto"
        >
          <h2 className="text-xl font-bold mb-4 text-red-900">Compare Cars</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {compare.map((id) => {
              const car = cars.find((car) => car.id === id);
              return (
                <CompareCard
                  key={car.id}
                  car={car}
                  onRemove={() => setCompare(compare.filter((cid) => cid !== car.id))}
                  onSelect={() => handleSelectVehicle(car.id)}
                />
              );
            })}
          </div>
          <Button 
            className="mt-4 bg-red-500 hover:bg-red-600 text-white" 
            onClick={() => setShowCompareView(false)}
          >
            Close Compare View
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(expanded ? filteredCars : filteredCars.slice(0, 3)).map((car) => (
          <Card key={car.id} className="shadow-lg bg-white rounded-lg border-2 border-red-200 hover:shadow-xl transition-shadow">
            <CardContent>
              <img src={car.image} alt={car.name} className="w-full h-40 object-cover rounded-t-lg mb-4" />
              <h3 className="text-lg font-bold mb-2 text-red-900">{car.name}</h3>
              <p className="text-red-700">Match: {car.match}%</p>
              <div className="flex space-x-2">
                <Button 
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white" 
                  onClick={() => setShowDetails(car.id)}
                >
                  Show Details
                </Button>
                <Button
                  className={`mt-4 ${compare.includes(car.id) ? 'bg-red-400' : 'bg-red-600'} hover:bg-red-700 text-white`}
                  onClick={() => handleCompare(car)}
                >
                  {compare.includes(car.id) ? "Remove" : "Compare"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!expanded && filteredCars.length > 3 && (
        <Button 
          className="mt-4 bg-red-600 hover:bg-red-700 text-white" 
          onClick={() => setExpanded(true)}
        >
          See More
        </Button>
      )}

      {showDetails && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full border-4 border-red-600 shadow-2xl">
            {(() => {
              const car = cars.find((car) => car.id === showDetails);
              return (
                <>
                  <h3 className="text-xl font-bold mb-4 text-red-900 border-b-2 border-red-200 pb-2">
                    {car.name}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <p className="text-red-800"><span className="font-semibold">Model Year:</span> {car.model_year}</p>
                      <p className="text-red-800"><span className="font-semibold">Starting Price:</span> ${car.price.toLocaleString()}</p>
                      <p className="text-red-800"><span className="font-semibold">Local MPG:</span> {car.local_mpg}</p>
                      <p className="text-red-800"><span className="font-semibold">Highway MPG:</span> {car.highway_mpg}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-red-800"><span className="font-semibold">Fuel Type:</span> {car.fuel_type}</p>
                      <p className="text-red-800"><span className="font-semibold">Engine:</span> {car.car_engine}</p>
                      <p className="text-red-800"><span className="font-semibold">Color:</span> {car.color}</p>
                      <p className="text-red-800"><span className="font-semibold">Vehicle Type:</span> {car.vehicle_type}</p>
                    </div>
                  </div>
                  <div className="border-t-2 border-red-200 pt-4">
                    <p className="text-red-800 mb-4"><span className="font-semibold">Description:</span> {car.details}</p>
                    <div className="flex justify-end">
                      <Button 
                        className="bg-red-600 hover:bg-red-700 text-white" 
                        onClick={() => setShowDetails(null)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CarMatch;