async function test() {
  const res = await fetch('http://localhost:3000/api/lost-found', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'found',
      category: 'Electronics',
      title: 'Test Found Item',
      description: 'Found a test item',
      location: 'Campus',
      handoffNote: 'Gave to admin',
      structuredLocation: { custodian: 'Admin', building: 'Campus', floor: 'None', specific_area: 'None', status: 'custodial' },
      date: new Date().toISOString(),
      contactInfo: 'Not provided',
      imageUrl: null,
    }),
  });
  console.log(res.status);
  console.log(await res.json());
}
test();
