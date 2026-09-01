export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  const { password } = req.body;
  
  if (password === process.env.PORTAL_PASSWORD) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Invalid password" });
  }
}
