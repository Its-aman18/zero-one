const http = require('http');

const PORT = 5174;
const BASE_URL = `http://localhost:${PORT}`;

function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json,
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('============================================================');
  console.log('STARTING SUPER ADMIN AUTHORIZATION & SECURITY TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Server Health / State
    const stateRes = await request('/api/state');
    assert(stateRes.statusCode === 200, 'GET /api/state returns 200 OK');

    // 2. Normal user calls POST /api/admin/verify without Super Admin header
    const normalVerifyRes = await request('/api/admin/verify', {
      method: 'POST',
      headers: {
        'x-user-email': 'aman@scriet.edu',
      },
    }, { email: 'kavita@scriet.ac.in' });
    assert(
      normalVerifyRes.statusCode === 403,
      `Normal user calling POST /api/admin/verify returns 403 Forbidden (Got: ${normalVerifyRes.statusCode})`
    );

    // 3. Normal ADMIN (not Super Admin) attempts to verify another admin
    const normalAdminVerifyRes = await request('/api/admin/verify', {
      method: 'POST',
      headers: {
        'x-user-email': 'admin-normal@scriet.edu',
        'x-user-role': 'ADMIN',
      },
    }, { email: 'kavita@scriet.ac.in' });
    assert(
      normalAdminVerifyRes.statusCode === 403,
      `Standard ADMIN attempting to verify another admin returns 403 Forbidden (Got: ${normalAdminVerifyRes.statusCode})`
    );

    // 4. Normal user attempting self-application (POST /api/participant/admin-apply)
    const oldApplyRes = await request('/api/participant/admin-apply', {
      method: 'POST',
      headers: {
        'x-user-email': 'aman@scriet.edu',
      },
    }, { reason: 'I want to be admin' });
    assert(
      oldApplyRes.statusCode === 403,
      `Old self-application POST /api/participant/admin-apply returns 403 Forbidden (Got: ${oldApplyRes.statusCode})`
    );

    // 5. Super Admin searching for a non-existent user
    const searchNonExistent = await request('/api/admin/search-user?email=nonexistent999@random.com', {
      method: 'GET',
      headers: {
        'x-user-email': 'applicationinformation73737@gmail.com',
      },
    });
    assert(
      searchNonExistent.statusCode === 404,
      `Super Admin searching non-existent user returns 404 Not Found (Got: ${searchNonExistent.statusCode})`
    );

    // 6. Super Admin searching for existing Code.SCRIET user (kavita@scriet.ac.in)
    const searchValid = await request('/api/admin/search-user?email=kavita@scriet.ac.in', {
      method: 'GET',
      headers: {
        'x-user-email': 'applicationinformation73737@gmail.com',
      },
    });
    assert(
      searchValid.statusCode === 200 && searchValid.body.user && searchValid.body.user.email === 'kavita@scriet.ac.in',
      `Super Admin searching existing user kavita@scriet.ac.in returns 200 with user profile (Name: ${searchValid.body?.user?.name})`
    );

    // 7. Super Admin verifies kavita@scriet.ac.in as ADMIN
    const verifyRes = await request('/api/admin/verify', {
      method: 'POST',
      headers: {
        'x-user-email': 'applicationinformation73737@gmail.com',
      },
    }, { email: 'kavita@scriet.ac.in', role: 'ADMIN' });
    assert(
      verifyRes.statusCode === 200 && verifyRes.body.authorization?.status === 'ACTIVE',
      `Super Admin verifies kavita@scriet.ac.in -> returns 200 with status ACTIVE (Role: ${verifyRes.body?.authorization?.role})`
    );

    // 8. Super Admin suspends kavita@scriet.ac.in
    const suspendRes = await request('/api/admin/suspend', {
      method: 'POST',
      headers: {
        'x-user-email': 'applicationinformation73737@gmail.com',
      },
    }, { email: 'kavita@scriet.ac.in', reason: 'Security drill suspension' });
    assert(
      suspendRes.statusCode === 200 && suspendRes.body.authorization?.status === 'SUSPENDED',
      `Super Admin suspends kavita@scriet.ac.in -> returns 200 with status SUSPENDED`
    );

    // 9. Super Admin reactivates kavita@scriet.ac.in
    const reactivateRes = await request('/api/admin/reactivate', {
      method: 'POST',
      headers: {
        'x-user-email': 'applicationinformation73737@gmail.com',
      },
    }, { email: 'kavita@scriet.ac.in' });
    assert(
      reactivateRes.statusCode === 200 && reactivateRes.body.authorization?.status === 'ACTIVE',
      `Super Admin reactivates kavita@scriet.ac.in -> returns 200 with status ACTIVE`
    );

    // 10. Super Admin revokes kavita@scriet.ac.in
    const revokeRes = await request('/api/admin/revoke', {
      method: 'POST',
      headers: {
        'x-user-email': 'applicationinformation73737@gmail.com',
      },
    }, { email: 'kavita@scriet.ac.in', reason: 'Event concluded' });
    assert(
      revokeRes.statusCode === 200 && revokeRes.body.authorization?.status === 'REVOKED',
      `Super Admin revokes kavita@scriet.ac.in -> returns 200 with status REVOKED`
    );

    // 11. Super Admin attempts to revoke or suspend bootstrap Super Admin account
    const revokeBootstrapRes = await request('/api/admin/revoke', {
      method: 'POST',
      headers: {
        'x-user-email': 'applicationinformation73737@gmail.com',
      },
    }, { email: 'applicationinformation73737@gmail.com' });
    assert(
      revokeBootstrapRes.statusCode === 400,
      `Revoking bootstrap Super Admin returns 400 Bad Request / Immune (Got: ${revokeBootstrapRes.statusCode})`
    );

    // 12. Check audit logs
    const auditRes = await request('/api/admin/audit-logs', {
      method: 'GET',
      headers: {
        'x-user-email': 'applicationinformation73737@gmail.com',
      },
    });
    const actions = (auditRes.body?.auditLogs || []).map((l) => l.action);
    const hasVerified = actions.includes('ADMIN_VERIFIED');
    const hasSuspended = actions.includes('ADMIN_SUSPENDED');
    const hasReactivated = actions.includes('ADMIN_REACTIVATED');
    const hasRevoked = actions.includes('ADMIN_REVOKED');
    assert(
      auditRes.statusCode === 200 && hasVerified && hasSuspended && hasReactivated && hasRevoked,
      `Audit logs record all actions: ADMIN_VERIFIED, ADMIN_SUSPENDED, ADMIN_REACTIVATED, ADMIN_REVOKED`
    );

    // 13. Re-verify kavita@scriet.ac.in as ACTIVE for browser demo
    await request('/api/admin/verify', {
      method: 'POST',
      headers: {
        'x-user-email': 'applicationinformation73737@gmail.com',
      },
    }, { email: 'kavita@scriet.ac.in', role: 'ADMIN' });
    console.log('✅ Staged kavita@scriet.ac.in as ACTIVE VERIFIED ADMIN for browser verification');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
