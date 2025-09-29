import express, { Request, Response } from 'express';
import { z } from 'zod';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const RandomUserApiResponseSchema = z.object({
  results: z.array(z.object({
    name: z.object({
      first: z.string(),
      last: z.string(),
    }),
    location: z.object({
      country: z.string(),
      city: z.string(),
      postcode: z.union([z.string(), z.number()]),
    }),
    login: z.object({
      username: z.string(),
    }),
    registered: z.object({
      date: z.string(),
    }),
  })),
});

const UserSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(12, "Name must be at most 12 characters"),
  age: z.number().int().min(18, "Age must be at least 18").max(100, "Age must be at most 100").optional().default(28),
  email: z.string().email("Must be a valid email").toLowerCase(),
});

// Part 1 — Minimal server & ping
app.get('/ping', (req: Request, res: Response) => {
  res.json({ message: 'pong' });
});

// Part 2 — Fetch random person
app.get('/random-person', async (req: Request, res: Response) => {
  try {
    const response = await fetch('https://randomuser.me/api/');
    const data = await response.json();
    
    const validatedData = RandomUserApiResponseSchema.parse(data);
    const person = validatedData.results[0];
    
    const result = {
      fullName: `${person.name.first} ${person.name.last}`,
      country: person.location.country
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching random person:', error);
    if (error instanceof z.ZodError) {
      res.status(500).json({ 
        error: 'Invalid response from RandomUser API',
        details: error.errors 
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch random person' });
    }
  }
});

// Phase 3 — User POST route
app.post('/users', (req: Request, res: Response) => {
  try {
    const validatedUser = UserSchema.parse(req.body);
    res.status(201).json(validatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});


app.get('/random-address', async (req: Request, res: Response) => {
  try {
    const response = await fetch('https://randomuser.me/api/');
    const data = await response.json();
    
    const validatedData = RandomUserApiResponseSchema.parse(data);
    const person = validatedData.results[0];
    
    const result = {
      city: person.location.city,
      postcode: person.location.postcode.toString()
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching random address:', error);
    if (error instanceof z.ZodError) {
      res.status(500).json({ 
        error: 'Invalid response from RandomUser API',
        details: error.errors 
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch random address' });
    }
  }
});

app.get('/random-login', async (req: Request, res: Response) => {
  try {
    const response = await fetch('https://randomuser.me/api/');
    const data = await response.json();
    
    const validatedData = RandomUserApiResponseSchema.parse(data);
    const person = validatedData.results[0];
    
    const registeredDate = new Date(person.registered.date);
    const formattedDate = registeredDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const result = {
      username: person.login.username,
      registeredDate: formattedDate,
      summary: `${person.login.username} (registered on ${formattedDate})`
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching random login:', error);
    if (error instanceof z.ZodError) {
      res.status(500).json({ 
        error: 'Invalid response from RandomUser API',
        details: error.errors 
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch random login' });
    }
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('  GET  /ping - Health check');
  console.log('  GET  /random-person - Get random person\'s name and country');
  console.log('  POST /users - Create/validate user (name, age, email)');
  console.log('  GET  /random-address - Get random address (city, postcode)');
  console.log('  GET  /random-login - Get random login info with summary');
});