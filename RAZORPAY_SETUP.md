# How to Get Your Razorpay API Keys (Test Mode)

You do **NOT** need to install any software or application. Razorpay is a website.

### Step 1: Create an Account
1. Open your browser and go to **[https://dashboard.razorpay.com/signup](https://dashboard.razorpay.com/signup)**.
2. Sign up using your Email or Google Account.

### Step 2: Switch to Test Mode
Once logged in, look at the **top menu bar**.
- You will see a toggle switch that says **"Live Mode"** or **"Test Mode"**.
- Click it to switch to **"Test Mode"** (It should turn orange/yellow).
- *Note: Test Mode allows you to make fake payments without real money.*

### Step 3: Generate API Keys
1. In the left sidebar, locate and click on **Settings** (usually a gear icon at the bottom).
2. Click on the **API Keys** tab.
3. Click the button **"Generate Test Key"**.
4. A popup will appear showing your details:
   - **Key ID** (starts with `rzp_test_...`)
   - **Key Secret** (a long string of random characters)

### Step 4: Connect to Fooddala
1. Copy the **Key ID** and **Key Secret**.
2. Open your project folder: `Fooddala -> backend -> .env`.
3. Paste them like this:
   ```env
   RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
   RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET_HERE
   ```
4. **Save** the file.
5. **Restart** your backend server.

### Step 5: Test It!
1. Go to the Fooddala Checkout page.
2. Select "Card/UPI".
3. Click "Place Order".
4. The Razorpay payment popup will now appear!
