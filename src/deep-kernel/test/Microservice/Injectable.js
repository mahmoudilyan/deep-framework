'use strict';

import chai from 'chai';
import {Injectable} from '../../lib/Microservice/Injectable';
import {Instance} from '../../lib/Microservice/Instance';
import {MissingWorkingMicroserviceException} from
  '../../lib/Microservice/Exception/MissingWorkingMicroserviceException';
import Core from 'deep-core';
import backendConfig from '../common/backend-cfg-json';

suite('Microservice/Injectable', function() {
  let injectable = new Injectable();
  let instance = null;

  test('Class Injectable exists in Microservice/Injectable', function() {
    chai.expect(typeof Injectable).to.equal('function');
  });

  test('Check constructor sets _config', function() {
    chai.expect(injectable._microservice).to.be.equal(null);
  });

  test('Check microservice getter throws "MissingWorkingMicroserviceException" ' +
    'exception for _microservice === null', function() {
    let error = null;
    let actualResult = null;
    try {
      actualResult = injectable.microservice;
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.not.equal(null);
    chai.expect(error).to.be.an.instanceof(MissingWorkingMicroserviceException);
    chai.expect(error.message).to.be.equal('Missing working microservice from Kernel.MicroserviceInjectable');
  });

  test('Check microservice setter throws ' +
    '"Core.Exception.InvalidArgumentException" exception', function() {
    let error = null;
    let instance = 'invalidInstance';
    try {
      injectable.microservice = instance;
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.not.equal(null);
    chai.expect(error.message).to.be.equal('microservice is not defined');
  });

  test('Check microservice setter sets _microservice', function() {
    let identifier = 'hello.world.example';
    let rawResources = backendConfig.microservices[identifier].resources;
    instance = new Instance(identifier, rawResources);
    injectable.microservice = instance;
    chai.expect(injectable.microservice).to.be.an.instanceof(Instance);
    chai.expect(injectable.microservice).to.be.equal(instance);
  });

  test('Check bind() method sets _microservice', function() {
    let identifier = 'deep.ng.root';
    let rawResources = backendConfig.microservices[identifier].resources;
    instance = new Instance(identifier, rawResources);
    injectable.bind(instance);
    chai.expect(injectable.microservice).to.be.an.instanceof(Instance);
    chai.expect(injectable.microservice).to.be.equal(instance);
  });
});
