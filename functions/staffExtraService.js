const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

function setCorsHeaders(res) {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
	res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function allowCors(req, res) {
	if (req.method === 'OPTIONS') {
		res.set('Access-Control-Allow-Origin', '*');
		res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
		res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		res.status(204).send('');
		return true;
	}
	res.set('Access-Control-Allow-Origin', '*');
	return false;
}

function requireRole(currentUserRole, allowed) {
	return allowed.includes(currentUserRole);
}

// Insert into top-level collections for evaluations and violations
async function addDocument(req, res, subcollection) {
	try {
		if (allowCors(req, res)) return;
    if (req.method !== 'POST') {
			setCorsHeaders(res);
			return res.status(405).json({ error: 'Method not allowed' });
		}
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { staffId, data, currentUserRole, branchId } = raw;
		if (!staffId || !data) { setCorsHeaders(res); return res.status(400).json({ error: 'staffId and data are required' }); }
		if (!requireRole(currentUserRole, ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'])) {
			setCorsHeaders(res);
			return res.status(403).json({ error: 'Insufficient permissions' });
		}
		// Write to top-level collections: evaluations or violations
		const ref = await db.collection(subcollection).add({
			branchId: branchId || null,
			stylistId: staffId,
			...data,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		setCorsHeaders(res);
		return res.status(200).json({ success: true, id: ref.id });
	} catch (err) {
		console.error(`Error adding to ${subcollection}:`, err);
		setCorsHeaders(res);
		return res.status(500).json({ error: `Failed to add ${subcollection.slice(0, -1)}: ${err.message}` });
	}
}

// List from top-level collections using stylistId
async function listDocuments(req, res, subcollection) {
	try {
		if (allowCors(req, res)) return;
    if (!['GET', 'POST'].includes(req.method)) {
			setCorsHeaders(res);
			return res.status(405).json({ error: 'Method not allowed' });
		}
		// Support both GET query and POST body
    const payload = req.method === 'GET' ? req.query : (typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
		const { staffId, currentUserRole } = payload || {};
		if (!staffId) { setCorsHeaders(res); return res.status(400).json({ error: 'staffId is required' }); }
		if (!requireRole(currentUserRole, ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'])) {
			setCorsHeaders(res);
			return res.status(403).json({ error: 'Insufficient permissions' });
		}
		const snapshot = await db
			.collection(subcollection)
			.where('stylistId', '==', staffId)
			.orderBy('createdAt', 'desc')
			.get();
		const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
		setCorsHeaders(res);
    return res.status(200).json({ success: true, items, count: items.length });
	} catch (err) {
		console.error(`Error listing ${subcollection}:`, err);
		setCorsHeaders(res);
		return res.status(500).json({ error: `Failed to list ${subcollection}: ${err.message}` });
	}
}

// Delete by id in top-level collections
async function deleteDocument(req, res, subcollection) {
	try {
		if (allowCors(req, res)) return;
		if (req.method !== 'DELETE') {
			setCorsHeaders(res);
			return res.status(405).json({ error: 'Method not allowed' });
		}
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { staffId, id, currentUserRole } = raw;
		if (!staffId || !id) { setCorsHeaders(res); return res.status(400).json({ error: 'staffId and id are required' }); }
		if (!requireRole(currentUserRole, ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'])) {
			setCorsHeaders(res);
			return res.status(403).json({ error: 'Insufficient permissions' });
		}
		await db.collection(subcollection).doc(id).delete();
		setCorsHeaders(res);
		return res.status(200).json({ success: true });
	} catch (err) {
		console.error(`Error deleting from ${subcollection}:`, err);
		setCorsHeaders(res);
		return res.status(500).json({ error: `Failed to delete ${subcollection.slice(0, -1)}: ${err.message}` });
	}
}

exports.addEvaluation = onRequest({ cors: true }, (req, res) => addDocument(req, res, 'evaluations'));
exports.listEvaluations = onRequest({ cors: true }, (req, res) => listDocuments(req, res, 'evaluations'));
exports.deleteEvaluation = onRequest({ cors: true }, (req, res) => deleteDocument(req, res, 'evaluations'));

// Certificates: map inside users document
  exports.addCertificate = onRequest({ cors: true }, async (req, res) => {
	try {
		if (allowCors(req, res)) return;
		if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { staffId, data, currentUserRole } = raw;
		if (!staffId || !data) { setCorsHeaders(res); return res.status(400).json({ error: 'staffId and data are required' }); }
		if (!requireRole(currentUserRole, ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'])) {
			setCorsHeaders(res);
			return res.status(403).json({ error: 'Insufficient permissions' });
		}
		const certId = data.id || db.collection('certificates_tmp').doc().id;
		const update = {};
		update[`certificates.${certId}`] = {
			name: data.name || '',
			issuer: data.issuer || '',
			date: data.date || '',
			createdAt: new Date(),
			updatedAt: new Date()
		};
		await db.collection('users').doc(staffId).set(update, { merge: true });
		setCorsHeaders(res);
		return res.status(200).json({ success: true, id: certId });
	} catch (err) {
		console.error('Error adding certificate:', err);
		setCorsHeaders(res);
		return res.status(500).json({ error: `Failed to add certificate: ${err.message}` });
	}
});

  exports.listCertificates = onRequest({ cors: true }, async (req, res) => {
	try {
		if (allowCors(req, res)) return;
    const payload = req.method === 'GET' ? req.query : (typeof req.body === 'string' ? JSON.parse(req.body) : req.body);
		const { staffId, currentUserRole } = payload || {};
		if (!staffId) { setCorsHeaders(res); return res.status(400).json({ error: 'staffId is required' }); }
		if (!requireRole(currentUserRole, ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'])) {
			setCorsHeaders(res);
			return res.status(403).json({ error: 'Insufficient permissions' });
		}
		const doc = await db.collection('users').doc(staffId).get();
		const data = doc.exists ? (doc.data().certificates || {}) : {};
		const items = Object.entries(data).map(([id, value]) => ({ id, ...value }));
		setCorsHeaders(res);
		return res.status(200).json({ success: true, items, count: items.length });
	} catch (err) {
		console.error('Error listing certificates:', err);
		setCorsHeaders(res);
		return res.status(500).json({ error: `Failed to list certificates: ${err.message}` });
	}
});

  exports.deleteCertificate = onRequest({ cors: true }, async (req, res) => {
	try {
		if (allowCors(req, res)) return;
		if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
    const raw = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { staffId, id, currentUserRole } = raw;
		if (!staffId || !id) { setCorsHeaders(res); return res.status(400).json({ error: 'staffId and id are required' }); }
		if (!requireRole(currentUserRole, ['systemAdmin', 'operationalManager', 'branchAdmin', 'branchManager'])) {
			setCorsHeaders(res);
			return res.status(403).json({ error: 'Insufficient permissions' });
		}
		await db.collection('users').doc(staffId).update({ [`certificates.${id}`]: FieldValue.delete() });
		setCorsHeaders(res);
		return res.status(200).json({ success: true });
	} catch (err) {
		console.error('Error deleting certificate:', err);
		setCorsHeaders(res);
		return res.status(500).json({ error: `Failed to delete certificate: ${err.message}` });
	}
});

exports.addViolation = onRequest({ cors: true }, (req, res) => addDocument(req, res, 'violations'));
exports.listViolations = onRequest({ cors: true }, (req, res) => listDocuments(req, res, 'violations'));
exports.deleteViolation = onRequest({ cors: true }, (req, res) => deleteDocument(req, res, 'violations'));


