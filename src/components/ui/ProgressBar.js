const ProgressBar = ({ value, label }) => (
  <div className="space-y-2 mb-4">
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="text-blue-600 font-medium">{value}%</span>
    </div>
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div 
        className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
        style={{ width: `${value}%` }} // Corrected line
      />
    </div>
  </div>
);

export default ProgressBar;
