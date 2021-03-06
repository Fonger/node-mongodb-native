'use strict';
const os = require('os');
const fs = require('fs');
const { expect } = require('chai');
const { parseOptions } = require('../../src/connection_string');
const { ReadConcern } = require('../../src/read_concern');
const { WriteConcern } = require('../../src/write_concern');
const { ReadPreference } = require('../../src/read_preference');
const { Logger } = require('../../src/logger');
const { MongoCredentials } = require('../../src/cmap/auth/mongo_credentials');
const { MongoClient } = require('../../src');

describe('MongoOptions', function () {
  it('MongoClient should always freeze public options', function () {
    const client = new MongoClient('mongodb://localhost:27017');
    expect(client.options).to.be.frozen;
  });

  it('programmatic options should override URI options', function () {
    const options = parseOptions('mongodb://localhost:27017/test?directConnection=true', {
      directConnection: false
    });
    expect(options.directConnection).to.be.false;
    expect(options.hosts).has.length(1);
    expect(options.dbName).to.equal('test');
    expect(options.prototype).to.not.exist;
  });

  it('should rename tls options correctly', function () {
    const filename = `${os.tmpdir()}/tmp.pem`;
    fs.closeSync(fs.openSync(filename, 'w'));
    const options = parseOptions('mongodb://localhost:27017/?ssl=true', {
      tlsCertificateKeyFile: filename,
      tlsCertificateFile: filename,
      tlsCAFile: filename,
      sslCRL: filename,
      tlsCertificateKeyFilePassword: 'tlsCertificateKeyFilePassword',
      sslValidate: false
    });
    fs.unlinkSync(filename);

    /*
     * If set TLS enabled, equivalent to setting the ssl option.
     *
     * ### Additional options:
     *
     * |    nodejs option     | MongoDB equivalent                                 | type                                   |
     * |:---------------------|----------------------------------------------------|:---------------------------------------|
     * | `ca`                 | sslCA, tlsCAFile                                   | `string \| Buffer \| Buffer[]`         |
     * | `crl`                | sslCRL                                             | `string \| Buffer \| Buffer[]`         |
     * | `cert`               | sslCert, tlsCertificateFile                        | `string \| Buffer \| Buffer[]`         |
     * | `key`                | sslKey, tlsCertificateKeyFile                      | `string \| Buffer \| KeyObject[]`      |
     * | `passphrase`         | sslPass, tlsCertificateKeyFilePassword             | `string`                               |
     * | `rejectUnauthorized` | sslValidate                                        | `boolean`                              |
     *
     */
    expect(options).to.not.have.property('tlsCertificateKeyFile');
    expect(options).to.not.have.property('tlsCAFile');
    expect(options).to.not.have.property('sslCRL');
    expect(options).to.not.have.property('tlsCertificateKeyFilePassword');
    expect(options).has.property('ca', '');
    expect(options).has.property('crl', '');
    expect(options).has.property('cert', '');
    expect(options).has.property('key');
    expect(options.key).has.length(0);
    expect(options).has.property('passphrase', 'tlsCertificateKeyFilePassword');
    expect(options).has.property('rejectUnauthorized', false);
    expect(options).has.property('tls', true);
  });

  const ALL_OPTIONS = {
    appName: 'cats',
    auth: { username: 'username', password: 'password' },
    authMechanism: 'SCRAM-SHA-1',
    authMechanismProperties: { SERVICE_NAME: 'service name here' },
    authSource: 'refer to dbName',
    autoEncryption: { bypassAutoEncryption: true },
    checkKeys: true,
    checkServerIdentity: false,
    compressors: 'snappy', // TODO
    connectTimeoutMS: 123,
    directConnection: true,
    dbName: 'test',
    driverInfo: { name: 'MyDriver', platform: 'moonOS' },
    family: 6,
    fieldsAsRaw: { rawField: true },
    forceServerObjectId: true,
    fsync: true,
    heartbeatFrequencyMS: 3,
    ignoreUndefined: false,
    j: true,
    journal: false,
    keepAlive: true,
    keepAliveInitialDelay: 3,
    localThresholdMS: 3,
    logger: new Logger('Testing!'),
    loggerLevel: 'info',
    maxIdleTimeMS: 3,
    maxPoolSize: 2,
    maxStalenessSeconds: 3,
    minInternalBufferSize: 0,
    minPoolSize: 1,
    monitorCommands: true,
    noDelay: true,
    pkFactory: {
      createPk() {
        return 'very unique';
      }
    },
    promiseLibrary: global.Promise,
    promoteBuffers: true,
    promoteLongs: false,
    promoteValues: false,
    raw: true,
    readConcern: new ReadConcern(ReadConcern.AVAILABLE),
    readConcernLevel: ReadConcern.LINEARIZABLE,
    readPreference: ReadPreference.primary,
    readPreferenceTags: [{ loc: 'ny' }],
    replicaSet: 'phil',
    retryReads: false,
    retryWrites: true,
    serializeFunctions: true,
    serverSelectionTimeoutMS: 3,
    servername: 'some tls option',
    socketTimeoutMS: 3,
    ssl: true,
    sslPass: 'pass',
    sslValidate: true,
    tls: false,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    tlsCertificateKeyFilePassword: 'tls-pass',
    w: 'majority',
    waitQueueTimeoutMS: 3,
    writeConcern: new WriteConcern(2),
    wtimeout: 5,
    wtimeoutMS: 6,
    zlibCompressionLevel: 2
  };

  it('All options', function () {
    const options = parseOptions('mongodb://localhost:27017/', ALL_OPTIONS);

    // Check consolidated options
    expect(options).has.property('writeConcern');
    expect(options.writeConcern).has.property('w', 2);
    expect(options.writeConcern).has.property('j', true);
  });

  const allURIOptions =
    'mongodb://myName@localhost:27017/test?' +
    [
      'appname=myBestApp',
      'authMechanism=scram-sha-1',
      'authMechanismProperties=opt1:val1',
      'authSource=authDb',
      'compressors=zlib,snappy',
      'connectTimeoutMS=2',
      'directConnection=true',
      'heartbeatFrequencyMS=2',
      'journal=true',
      'localThresholdMS=2',
      'maxIdleTimeMS=2',
      'maxPoolSize=4',
      'maxStalenessSeconds=2',
      'minPoolSize=2',
      'readConcernLevel=local',
      'readPreference=nearest',
      'readPreferenceTags=dc:ny,rack:1',
      'replicaSet=phil',
      'retryReads=true',
      'retryWrites=true',
      'serverSelectionTimeoutMS=2',
      'socketTimeoutMS=2',
      'ssl=true',
      'tls=true',
      'tlsAllowInvalidCertificates=true',
      'tlsAllowInvalidHostnames=true',
      'tlsCertificateKeyFilePassword=PASSWORD',
      'w=majority',
      'waitQueueTimeoutMS=2',
      'wTimeoutMS=2',
      'zlibCompressionLevel=2'
    ].join('&');

  it('All URI options', function () {
    const options = parseOptions(allURIOptions);
    expect(options).has.property('zlibCompressionLevel', 2);

    expect(options).has.property('writeConcern');
    expect(options.writeConcern).has.property('w', 'majority');
    expect(options.writeConcern).has.property('wtimeout', 2);
  });

  it('srvHost saved to options for later resolution', function () {
    const options = parseOptions('mongodb+srv://server.example.com/');
    expect(options).has.property('srvHost', 'server.example.com');
  });

  it('supports ReadPreference option in url', function () {
    const options = parseOptions('mongodb://localhost/?readPreference=nearest');
    expect(options.readPreference).to.be.an.instanceof(ReadPreference);
    expect(options.readPreference.mode).to.equal('nearest');
  });

  it('supports ReadPreference option in object plain', function () {
    const options = parseOptions('mongodb://localhost', {
      readPreference: { mode: 'nearest', hedge: { enabled: true } }
    });
    expect(options.readPreference).to.be.an.instanceof(ReadPreference);
    expect(options.readPreference.mode).to.equal('nearest');
    expect(options.readPreference.hedge).to.include({ enabled: true });
  });

  it('supports ReadPreference option in object proper class', function () {
    const tag = { rack: 1 };
    const options = parseOptions('mongodb://localhost', {
      readPreference: new ReadPreference('nearest', [tag], { maxStalenessSeconds: 20 })
    });
    expect(options.readPreference).to.be.an.instanceof(ReadPreference);
    expect(options.readPreference.mode).to.equal('nearest');
    expect(options.readPreference.tags).to.be.an('array').that.includes(tag);
    expect(options.readPreference.maxStalenessSeconds).to.equal(20);
    // maxStalenessSeconds sets the minWireVersion
    expect(options.readPreference.minWireVersion).to.be.at.least(5);
  });

  it('supports WriteConcern option in url', function () {
    const options = parseOptions('mongodb://localhost/?w=3');
    expect(options.writeConcern).to.be.an.instanceof(WriteConcern);
    expect(options.writeConcern.w).to.equal(3);
  });

  it('supports WriteConcern option in object plain', function () {
    const options = parseOptions('mongodb://localhost', {
      writeConcern: { w: 'majority', wtimeoutMS: 300 }
    });
    expect(options.writeConcern).to.be.an.instanceof(WriteConcern);
    expect(options.writeConcern.w).to.equal('majority');
    expect(options.writeConcern.wtimeout).to.equal(300);
  });

  it('supports WriteConcern option in object proper class', function () {
    const options = parseOptions('mongodb://localhost', {
      writeConcern: new WriteConcern(5, 200, true)
    });
    expect(options.writeConcern).to.be.an.instanceof(WriteConcern);
    expect(options.writeConcern.w).to.equal(5);
    expect(options.writeConcern.wtimeout).to.equal(200);
    expect(options.writeConcern.j).to.equal(true);
  });

  it('supports ReadConcern option in url', function () {
    const options = parseOptions('mongodb://localhost/?readConcernLevel=available');
    expect(options.readConcern).to.be.an.instanceof(ReadConcern);
    expect(options.readConcern.level).to.equal('available');
  });

  it('supports ReadConcern option in object plain', function () {
    const options = parseOptions('mongodb://localhost', {
      readConcern: { level: 'linearizable' }
    });
    expect(options.readConcern).to.be.an.instanceof(ReadConcern);
    expect(options.readConcern.level).to.equal('linearizable');
  });

  it('supports ReadConcern option in object proper class', function () {
    const options = parseOptions('mongodb://localhost', {
      readConcern: new ReadConcern('snapshot')
    });
    expect(options.readConcern).to.be.an.instanceof(ReadConcern);
    expect(options.readConcern.level).to.equal('snapshot');
  });

  it('supports Credentials option in url', function () {
    const options = parseOptions('mongodb://USERNAME:PASSWORD@localhost/');
    expect(options.credentials).to.be.an.instanceof(MongoCredentials);
    expect(options.credentials.username).to.equal('USERNAME');
    expect(options.credentials.password).to.equal('PASSWORD');
    expect(options.credentials.source).to.equal('admin');
  });

  it('supports Credentials option in url with db', function () {
    const options = parseOptions('mongodb://USERNAME:PASSWORD@localhost/foo');
    expect(options.credentials).to.be.an.instanceof(MongoCredentials);
    expect(options.credentials.username).to.equal('USERNAME');
    expect(options.credentials.password).to.equal('PASSWORD');
    expect(options.credentials.source).to.equal('foo');
  });

  it('supports Credentials option in auth object plain', function () {
    const options = parseOptions('mongodb://localhost/', {
      auth: { username: 'USERNAME', password: 'PASSWORD' }
    });
    expect(options.credentials).to.be.an.instanceof(MongoCredentials);
    expect(options.credentials.username).to.equal('USERNAME');
    expect(options.credentials.password).to.equal('PASSWORD');
  });
});
