import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  TextField
} from '@mui/material';
import axios from 'axios';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import './styles.css';

Chart.register(...registerables);

// StatsCard Component
const StatsCard = ({ title, value, color }) => {
  return (
    <Card sx={{ bgcolor: color, boxShadow: 3, borderRadius: 2, transition: '0.3s', '&:hover': { boxShadow: 6 } }}>
      <CardContent>
        <Typography color="white" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'white' }}>
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

// LineChart Component
const LineChart = ({ data }) => {
  return (
    <Line
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'COVID-19 Historical Trend',
            position: 'bottom',
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value.toLocaleString();
              }
            }
          }
        }
      }}
    />
  );
};

// PieChart Component
const PieChart = ({ data }) => {
  return (
    <Pie
      data={data}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'COVID-19 Distribution',
            position: 'bottom',
          }
        }
      }}
    />
  );
};

// CountrySelector Component
const CountrySelector = ({ countries, selectedCountry, onChange }) => {
  return (
    <FormControl fullWidth>
      <InputLabel id="country-select-label">Select Country</InputLabel>
      <Select
        labelId="country-select-label"
        id="country-select"
        value={selectedCountry}
        label="Select Country"
        onChange={onChange}
      >
        {countries.map((country) => (
          <MenuItem key={country.code} value={country.code}>
            {country.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

function App() {
  const [stats, setStats] = useState({ cases: 0, deaths: 0, recovered: 0 });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('usa');
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch countries list and sort alphabetically
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await axios.get('https://restcountries.com/v3.1/all');
        const countryList = response.data.map(country => ({
          name: country.name.common,
          code: country.cca2.toLowerCase()
        }));

        // Sort countries alphabetically by name
        countryList.sort((a, b) => a.name.localeCompare(b.name));
        setCountries(countryList);
      } catch (error) {
        console.error('Error fetching countries:', error);
        setError('Error fetching countries. Please try again later.');
      }
    };
    fetchCountries();
  }, []);

  // Fetch historical data for the selected country
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const statsResponse = await axios.get(`https://disease.sh/v3/covid-19/countries/${selectedCountry}`);
        setStats(statsResponse.data);

        const historicalResponse = await axios.get(
          `https://disease.sh/v3/covid-19/historical/${selectedCountry}?lastdays=1500`
        );

        const timeline = historicalResponse.data.timeline || historicalResponse.data;

        // Filter data based on selected dates
        const filteredLabels = Object.keys(timeline.cases).filter((date) => {
          const dateObj = new Date(date);
          return (
            (!startDate || dateObj >= new Date(startDate)) &&
            (!endDate || dateObj <= new Date(endDate))
          );
        });

        const filteredCases = filteredLabels.map((date) => timeline.cases[date]);
        const filteredDeaths = filteredLabels.map((date) => timeline.deaths[date]);
        const filteredRecovered = filteredLabels.map((date) => timeline.recovered[date]);

        setChartData({
          labels: filteredLabels,
          datasets: [
            {
              label: 'Total Cases',
              data: filteredCases,
              fill: false,
              borderColor: '#4CAF50', // Green
              tension: 0.1,
            },
            {
              label: 'Deaths',
              data: filteredDeaths,
              fill: false,
              borderColor: '#F44336', // Red
              tension: 0.1,
            },
            {
              label: 'Recovered',
              data: filteredRecovered,
              fill: false,
              borderColor: '#2196F3', // Blue
              tension: 0.1,
            }
          ],
        });
      } catch (error) {
        console.error('Error fetching historical data:', error);
        setError('Error fetching historical data. Please try again later.');
      }
    };

    if (selectedCountry) {
      fetchHistoricalData();
    }
  }, [selectedCountry, startDate, endDate]);

  // Handle country selection change
  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
    setError(null); // Clear any previous errors when changing country
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
        COVID-19 Dashboard
      </Typography>

      {error && <Typography color="error">{error}</Typography>}

      {/* Country Selector */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <CountrySelector 
            countries={countries} 
            selectedCountry={selectedCountry} 
            onChange={handleCountryChange} 
          />
        </CardContent>
      </Card>

      {/* Date Filter */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="End Date"
            type="date"
            fullWidth
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>
      </Grid>

      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <StatsCard title="Total Cases" value={stats.cases} color="#4CAF50" /> {/* Green */}
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard title="Deaths" value={stats.deaths} color="#F44336" /> {/* Red */}
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsCard title="Recovered" value={stats.recovered} color="#2196F3" /> {/* Blue */}
        </Grid>
      </Grid>

      {/* Add space between Stats Cards and Charts */}
      <div style={{ margin: '40px 0' }} />

      {/* Charts Side by Side */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} sx={{ height: '400px' }}>
          <LineChart data={chartData} />
        </Grid>
        <Grid item xs={12} md={6} sx={{ height: '400px' }}>
          <PieChart
            data={{
              labels: ['Cases', 'Deaths', 'Recovered'],
              datasets: [
                {
                  data: [stats.cases, stats.deaths, stats.recovered],
                  backgroundColor: ['#4CAF50', '#F44336', '#2196F3'], // Green, Red, Blue
                },
              ],
            }}
          />
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;