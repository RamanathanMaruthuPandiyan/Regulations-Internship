import { assert , use} from 'chai';
import chaiHttp from 'chai-http';
import app from '../app.js';
import config from '../config/config.dev.json'  assert { type: 'json' };

const server = use(chaiHttp);

const authKey = config.authServerConfig.bypassIds.generalPurpose;
let gradeLetter = "G"
let newValue = "G+"

describe('Attributes Routes', () => {
    it('should return a list of distinct attribute names', (done) => {
        server.request(app)
            .get('/attributes/distinct')
            .set('Authorization', authKey)
            .end((err, res) => {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.isArray(res.body);
                const distinctNames = res.body;
                const uniqueNames = new Set(distinctNames);
                assert.equal(uniqueNames.size, distinctNames.length, 'Response should contain distinct attribute names');

                done();
            });
    });

    it('should add a new attribute value', (done) => {
        const serverBody = {
            name: 'Letter Grade',
            value: gradeLetter
        };

        server.request(app)
            .post('/attributes')
            .set('Authorization', authKey)
            .send(serverBody)
            .end((err, res) => {
                assert.isNull(err);
                assert.equal(res.status, 200);
                done();
            });
    });

    it('should return a paginated list of attribute values', (done) => {
        const serverBody = {
            filter: {},
            skip: 0,
            limit: 10,
            search: '',
            sort: { "values": 1 }
        };

        server.request(app)
            .post('/attributes/pagination')
            .set('Authorization', authKey)
            .send(serverBody)
            .end((err, res) => {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.isObject(res.body)
                assert.isArray(res.body.records);
                done();
            });
    });

    it('should return distinct values for a given attribute name', (done) => {
        server.request(app)
            .get('/attributes/distinct/letterGrade')
            .set('Authorization', authKey)
            .end((err, res) => {
                assert.isNull(err);
                assert.equal(res.status, 200);
                assert.isArray(res.body);
                done();
            });
    });

    it('should update an attribute value', (done) => {
        const serverBody = {
            name: 'Letter Grade',
            oldValue: gradeLetter,
            newValue: newValue
        };

        server.request(app)
            .put('/attributes')
            .send(serverBody)
            .set('Authorization', authKey)
            .end((err, res) => {
                assert.isNull(err);
                assert.equal(res.status, 200);
                done();
            });
    });

    it('should delete an attribute value', (done) => {
        const serverBody = {
            name: 'Letter Grade',
            value: newValue
        };

        server.request(app)
            .delete('/attributes')
            .set('Authorization', authKey)
            .send(serverBody)
            .end((err, res) => {
                assert.isNull(err);
                assert.equal(res.status, 200);
                done();
            });
    });
});
