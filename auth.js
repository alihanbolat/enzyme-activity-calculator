// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active form
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(tab + 'Form').classList.add('active');
        
        hideMessage();
    });
});

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        showMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

// Signup form handler
document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    
    if (password !== passwordConfirm) {
        showMessage('Passwords do not match!', 'error');
        return;
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin + '/dashboard.html'
            }
        });
        
        if (error) throw error;
        
        // Check if email confirmation is required
        if (data.user && data.session) {
            // User is auto-confirmed (email confirmation disabled)
            showMessage('Account created! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else if (data.user && !data.session) {
            // Email confirmation required
            showMessage('Account created! Please check your email to confirm your account.', 'success');
        } else {
            showMessage('Account created! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        if (error.message.includes('confirmation email')) {
            showMessage('Account created but email confirmation is not configured. Please contact the administrator or try logging in directly.', 'error');
        } else {
            showMessage(error.message, 'error');
        }
    }
});

// Google Sign-In
document.getElementById('googleSignIn').addEventListener('click', async () => {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });
        
        if (error) throw error;
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
});

function showMessage(message, type) {
    const messageDiv = document.getElementById('authMessage');
    messageDiv.textContent = message;
    messageDiv.className = 'auth-message ' + type;
    messageDiv.style.display = 'block';
}

function hideMessage() {
    const messageDiv = document.getElementById('authMessage');
    messageDiv.style.display = 'none';
}

// Check if user is already logged in
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        window.location.href = 'dashboard.html';
    }
});
