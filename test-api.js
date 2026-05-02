import fetch from 'node-fetch';

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/parliamentarians?user_id=test');
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();