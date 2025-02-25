const Gendpoint = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

// User query to get user details
const   userQuery = `
query {
    user {
        id
        login
        firstName
        lastName
        email
    }
}
`;

// XP transaction query to get XP transaction details
const xpQuery = `
query {
    transaction(where: { type: { _eq: "xp" } }) {
        amount
        createdAt
        userLogin
        path
    }
}
`;

// Progress query to get user progress details
const progressQuery = `
query {
    progress {
        id
        userId
        grade
        createdAt
        updatedAt
        path
    }
}
`;

const auditsQuery = `
query{
  user{
    audits{
      auditor {
        id
      }
    }
    auditRatio
    totalUp
    totalDown
  }
}
`;

const skillsQuery = `
query {
  skillTransactions: transaction(
    order_by: [{ type: desc }, { amount: desc }],
    distinct_on: [type],
    where: { type: { _like: "skill_%" } }
  ) {
    type
    amount
  }
}
  `

// Function to make the GraphQL request
async function fetchUserData() {
  try {
    const response = await fetch(Gendpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken,
            },
      // credentials: 'include',  // Ensure cookies (JWT) are sent with the request
      body: JSON.stringify({
        query: userQuery,  // You can change this to another query like xpQuery or progressQuery
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

        // At the start of fetchUserData function, show the elements


  
  document.getElementById('userData').style.display = 'block';
  document.getElementById('progressDataOutput').style.display = 'block';
  document.getElementById('AuditsAndRatio').style.display = 'block';
  document.getElementById('SkillsOutput').style.display = 'block';
  document.querySelector('.login-box').style.display = 'none';
  document.getElementById('logoutButton').style.display = 'block';
  
    const data = await response.json();
    console.log('User Data:', data); 

    // const welcomeUser = document.getElementById('welcomeMessage');
    // welcomeUser.textContent = `Welcome, ${data.data.user[0].firstName} ${data.data.user[0].lastName}`;
    // document.getElementById('.welcomeMessage').style.display = 'block';

    document.getElementById('#username').textContent = data.data.user[0].login;
    document.getElementById('#FN').textContent = data.data.user[0].firstName;
    document.getElementById('#LN').textContent = data.data.user[0].lastName;
    document.getElementById('#email').textContent = data.data.user[0].email;

    fetchXPData();
    fetchProgressData();
    fetchAuditsAndRatio();
    fetchSkillsData();
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
}

async function fetchXPData() {
  try {
      const response = await fetch(Gendpoint, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + authToken,
          },
          body: JSON.stringify({
              query: xpQuery,  // XP query
          }),
      });

      if (!response.ok) {
          throw new Error('Failed to fetch XP data');
      }

      const data = await response.json();
      console.log('XP Data:', data);

      // Get the XP transactions (assuming the data is an array of objects)
      const transactions = data.data.transaction;

      // Select the SVG container where the bars will be created
      const svg = d3.select('#xpGraph');  // Correctly select the SVG container

      // Set margins for better padding and readability
      const margin = { top: 30, right: 30, bottom: 80, left: 60 };
      const width = 800 - margin.left - margin.right;
      const height = 400 - margin.top - margin.bottom;

      // Set the scaling for the graph
      const xScale = d3.scaleTime()  // Use scaleTime for dates
          .domain([d3.min(transactions, d => new Date(d.createdAt)), d3.max(transactions, d => new Date(d.createdAt))])  // Date scale
          .range([0, width]);

      const yScale = d3.scaleLinear()
          .domain([0, d3.max(transactions, d => d.amount)])  // Use max XP amount for scaling
          .range([height, 0]);

      // Create a group element to hold the graph with margin adjustments
      const graph = svg.append('g')  // Use svg.append() to create the graph group
          .attr('transform', `translate(${margin.left}, ${margin.top})`);

      // Create the bars based on the XP data
      graph.selectAll('.bar')
          .data(transactions)
          .enter()
          .append('rect')
          .attr('x', (d, i) => xScale(new Date(d.createdAt)))  // Map dates to X-axis
          .attr('y', d => yScale(d.amount))  // Set height of the bar based on XP value
          .attr('width', width / transactions.length)  // Adjust width based on number of bars
          .attr('height', d => height - yScale(d.amount))  // Set the height of the bars
          .attr('fill', 'purple');

      // Add the XP values (amount) on top of the bars
      graph.selectAll('.text')
          .data(transactions)
          .enter()
          .append('text')
          .attr('x', (d, i) => xScale(new Date(d.createdAt)) + width / transactions.length / 2)
          .attr('y', d => yScale(d.amount) - 10)  // Position the text above the bar
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .text(d => d.amount);  // Show the XP value

      // Add the dates (createdAt) below each bar
      graph.selectAll('.date')
          .data(transactions)
          .enter()
          .append('text')
          .attr('x', (d, i) => xScale(new Date(d.createdAt)) + width / transactions.length / 2)
          .attr('y', height + 20)  // Position the dates below the bars
          .attr('text-anchor', 'middle')
          .attr('fill', 'black')
          .text(d => new Date(d.createdAt).toLocaleDateString());  // Display the date

      // Add X-axis labels (dates)
      graph.append('g')
          .attr('transform', `translate(0, ${height})`)
          .call(d3.axisBottom(xScale).ticks(d3.timeDay.every(1)));  // Tick every day (or adjust as needed)

      // Add Y-axis labels
      graph.append('g')
          .call(d3.axisLeft(yScale));

  } catch (error) {
      console.error('Error fetching XP data:', error);
  }
}

// Function to fetch progress data
let gradedProgress = [];  // To store the graded progress data
let currentIndex = 0;  // To track the current progress entry being displayed

async function fetchProgressData() {
  try {
    const response = await fetch(Gendpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken,
      },
      body: JSON.stringify({
        query: progressQuery,  // Progress query
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch progress data');
    }

    const data = await response.json();
    console.log('Progress Data:', data);

    // Filter graded progress entries (excluding those with null grades)
    gradedProgress = data.data.progress.filter(progress => progress.grade !== null);

    // Show the first graded progress by default
    if (gradedProgress.length > 0) {
      displayProgressCard(0); // Display the first graded progress
    }
  } catch (error) {
    console.error('Error fetching progress data:', error);
  }
}

// Function to display the current graded progress in the card
function displayProgressCard(index) {
  const progressCard = document.getElementById('progressCard');

  if (gradedProgress.length > 0) {
    const progress = gradedProgress[index];
    progressCard.innerHTML = `
      <h3>${progress.path}</h3>
      <p class="grade">${progress.grade.toFixed(1)}</p>
      <p class="date">Created: ${new Date(progress.createdAt).toLocaleDateString()}</p>
      <p class="date">Updated: ${new Date(progress.updatedAt).toLocaleDateString()}</p>
    `;

    // Update the buttons' states based on the current index
    document.getElementById('prevButton').disabled = (index === 0);
    document.getElementById('nextButton').disabled = (index === gradedProgress.length - 1);
  }
}

// Function to show the next graded progress card
function showNextProgress() {
  if (currentIndex < gradedProgress.length - 1) {
    currentIndex++;
    displayProgressCard(currentIndex);
  }
}

// Function to show the previous graded progress card
function showPreviousProgress() {
  if (currentIndex > 0) {
    currentIndex--;
    displayProgressCard(currentIndex);
  }
}



async function fetchAuditsAndRatio() {
  try {
    const response = await fetch(Gendpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken,
      },
      body: JSON.stringify({
        query: auditsQuery,  // Progress query
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch progress data');
    }

    const data = await response.json();
    console.log('Audits Data:', data);

    // Extract values
    let auditRatio = parseFloat(data.data.user[0].auditRatio);  // Ensure it's a number
    let totalUp = parseFloat(data.data.user[0].totalUp);  // Ensure it's a number
    let totalDown = parseFloat(data.data.user[0].totalDown);  // Ensure it's a number

    console.log('Audit Ratio:', auditRatio);
    console.log('Total Up:', totalUp);
    console.log('Total Down:', totalDown);

    // Format the audit ratio
    auditRatio = auditRatio.toFixed(1);  // Round to one decimal place

    // Function to format numbers (e.g., 989425 => 984 kB)
    const formatNumber = (num) => {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + ' MB';  // Convert to MB
      } else if (num >= 1000) {
        return (num / 1000).toFixed(0) + ' kB';  // Convert to kB
      }
      return num.toString();  // If it's less than 1000, just show the number
    };

    // Format the values
    const formattedTotalUp = formatNumber(totalUp);
    const formattedTotalDown = formatNumber(totalDown);

    // Check if the values are valid numbers
    if (isNaN(auditRatio) || isNaN(totalUp) || isNaN(totalDown)) {
      console.error('Invalid data received');
      return;
    }

    // Calculate percentage based on totalUp and totalDown
    const totalRatio = (totalUp / (totalUp + totalDown)) * 100;  // Calculate total ratio as percentage
    console.log('Total Ratio:', totalRatio);

    // SVG circle radius and center position
    const radius = 80;
    const center = 100; // Center of the circle
    const circumference = 2 * Math.PI * radius;

    // Function to draw a circle segment based on percentage
    const createCircleSegment = (svgId, percentage, color) => {
      const svg = document.getElementById(svgId);
      svg.innerHTML = '';  // Clear previous content

      // Background circle (gray)
      const circleBackground = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circleBackground.setAttribute("cx", center);
      circleBackground.setAttribute("cy", center);
      circleBackground.setAttribute("r", radius);
      circleBackground.setAttribute("stroke", "#ddd");
      circleBackground.setAttribute("stroke-width", 20);
      circleBackground.setAttribute("fill", "none");
      svg.appendChild(circleBackground);

      // Circle segment (colored) based on the percentage
      const length = (circumference * percentage) / 100;  // Length based on percentage
      const arc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      arc.setAttribute("cx", center);
      arc.setAttribute("cy", center);
      arc.setAttribute("r", radius);
      arc.setAttribute("stroke", color);
      arc.setAttribute("stroke-width", 20);
      arc.setAttribute("fill", "none");
      arc.setAttribute("stroke-dasharray", `${length} ${circumference - length}`);
      arc.setAttribute("stroke-dashoffset", -90);  // Start from the top (90 degrees offset)

      svg.appendChild(arc);
    };

    // Draw the circle based on the totalRatio (for Total Up vs Total Down)
    createCircleSegment("totalUpDownGraph", totalRatio, "#FF9800");  // Orange for Total Up vs Down

    // Add text content based on values
    document.getElementById("auditRatioText").textContent = `${auditRatio}% Ratio`;
    document.getElementById("totalUpText").textContent = formattedTotalUp + ' Done';
    document.getElementById("totalDownText").textContent = formattedTotalDown + ' Received';

    // Dynamic messages
    if (auditRatio < 50) {
      document.getElementById("auditRatioMessage").textContent = "Make more audits!";
    } else {
      document.getElementById("auditRatioMessage").textContent = "Great job!";
    }

  } catch (error) {
    console.error('Error fetching progress data:', error);
  }
}

async function fetchSkillsData() {
  try {
    const response = await fetch(Gendpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken,
      },
      body: JSON.stringify({
        query: skillsQuery,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch skills data');
    }

    const data = await response.json();
    const skills = data.data.skillTransactions;

    // Set up SVG dimensions and margins
    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous content
    d3.select('#skillsGraph').html('');

    // Create SVG container
    const svg = d3.select('#skillsGraph')
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const x = d3.scaleBand()
      .range([0, width])
      .domain(skills.map(d => d.type.replace('skill_', '').toUpperCase()))
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(skills, d => d.amount)])
      .range([height, 0]);

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end');

    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(y));

    // Create bars
    svg.selectAll('bars')
      .data(skills)
      .enter()
      .append('rect')
      .attr('x', d => x(d.type.replace('skill_', '').toUpperCase()))
      .attr('y', d => y(d.amount))
      .attr('width', x.bandwidth())
      .attr('height', d => height - y(d.amount))
      .attr('fill', '#6a0dad')
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#ff4081');
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('fill', '#6a0dad');
      });

    // Add value labels on top of bars
    svg.selectAll('.label')
      .data(skills)
      .enter()
      .append('text')
      .attr('x', d => x(d.type.replace('skill_', '').toUpperCase()) + x.bandwidth()/2)
      .attr('y', d => y(d.amount) - 5)
      .attr('text-anchor', 'middle')
      .text(d => d.amount);

  } catch (error) {
    console.error('Error fetching skills data:', error);
  }
}



