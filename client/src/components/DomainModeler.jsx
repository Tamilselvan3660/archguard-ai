import React, { useState } from 'react';

export default function DomainModeler({ onShowToast }) {
  const [activeTab, setActiveTab] = useState('contexts'); // 'contexts', 'docker', 'k8s'

  const boundedContexts = [
    {
      id: 'ctx-user',
      name: 'User & Identity Context',
      icon: '👤',
      domain: 'Customer Management & Authentication',
      components: ['UserController.ts', 'UserService.ts', 'UserModel.ts'],
      recommendedPort: 8081,
      dbStrategy: 'Dedicated Postgres (user_db)',
      couplingScore: 'LOW (12% external coupling)'
    },
    {
      id: 'ctx-order',
      name: 'Order Management Context',
      icon: '📦',
      domain: 'Shopping Cart, Order Placement & Lifecycle',
      components: ['OrderController.ts', 'OrderService.ts'],
      recommendedPort: 8082,
      dbStrategy: 'Dedicated Postgres (order_db)',
      couplingScore: 'MEDIUM (22% external coupling due to Payment loop)'
    },
    {
      id: 'ctx-payment',
      name: 'Payment & Settlement Context',
      icon: '💳',
      domain: 'Payment Gateway Integration & Ledger',
      components: ['PaymentController.ts', 'PaymentService.ts'],
      recommendedPort: 8083,
      dbStrategy: 'Dedicated Postgres (payment_db) + Redis',
      couplingScore: 'MEDIUM (20% external coupling)'
    }
  ];

  const dockerCompose = `version: '3.8'

services:
  user-service:
    build: 
      context: ./services/user
    ports:
      - "8081:8081"
    environment:
      - DATABASE_URL=postgres://user:pass@user-db:5432/user_db
    depends_on:
      - user-db

  order-service:
    build:
      context: ./services/order
    ports:
      - "8082:8082"
    environment:
      - DATABASE_URL=postgres://user:pass@order-db:5432/order_db
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - order-db
      - kafka

  payment-service:
    build:
      context: ./services/payment
    ports:
      - "8083:8083"
    environment:
      - DATABASE_URL=postgres://user:pass@payment-db:5432/payment_db
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - payment-db
      - kafka

  # Dedicated Databases (Database-per-Service Pattern)
  user-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: user_db

  order-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: order_db

  payment-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: payment_db

  # Event Bus for Async Decoupling
  kafka:
    image: confluentinc/cp-kafka:latest
    ports:
      - "9092:9092"`;

  const k8sManifest = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service-deployment
  namespace: ecommerce
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: acme-registry.io/ecommerce/order-service:v2.4.1
        ports:
        - containerPort: 8082
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: order-service
  namespace: ecommerce
spec:
  selector:
    app: order-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8082`;

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text);
    if (onShowToast) onShowToast(`Copied ${label} to clipboard!`);
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Domain Modeler & Microservice Decomposition Advisor</h1>
          <div className="page-subtitle">
            Automated Domain-Driven Design (DDD) bounded context extraction to decompose monoliths into microservices.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={activeTab === 'contexts' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('contexts')}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            🧩 Bounded Contexts (DDD)
          </button>
          <button 
            className={activeTab === 'docker' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('docker')}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            🐳 Docker Compose Architecture
          </button>
          <button 
            className={activeTab === 'k8s' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveTab('k8s')}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            ☸️ Kubernetes Deployment
          </button>
        </div>
      </div>

      {activeTab === 'contexts' && (
        <div>
          {/* Executive Strategy Banner */}
          <div className="card" style={{ marginBottom: '24px', background: 'radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.08), transparent 70%), var(--bg-card)' }}>
            <div className="card-header" style={{ marginBottom: '10px' }}>
              <div className="card-title">
                <span>🎯</span>
                <span>Decomposition Feasibility: HIGH (18% Inter-Service Coupling)</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                DATABASE-PER-SERVICE READY
              </span>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              The AST graph analysis shows clear high cohesion within modules and only 2 cross-boundary call points. By replacing synchronous calls between <code>PaymentService</code> and <code>OrderService</code> with an event bus, the codebase can be decomposed into 3 autonomous microservices with zero shared database coupling.
            </p>
          </div>

          {/* 3 Bounded Context Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {boundedContexts.map(ctx => (
              <div key={ctx.id} className="bounded-context-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.8rem' }}>{ctx.icon}</span>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    color: 'var(--accent-cyan)', 
                    background: 'rgba(56, 189, 248, 0.1)', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)' 
                  }}>
                    PORT {ctx.recommendedPort}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '6px' }}>{ctx.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginBottom: '16px' }}>
                  {ctx.domain}
                </p>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    INCLUDED COMPONENTS:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {ctx.components.map(c => (
                      <span key={c} style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-card)', padding: '5px 10px', borderRadius: '4px' }}>
                        • {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-card)', fontSize: '0.78rem' }}>
                  <div style={{ color: 'var(--text-muted)' }}>DB Strategy:</div>
                  <div style={{ color: 'var(--accent-amber)', fontWeight: 600, marginTop: '2px' }}>{ctx.dbStrategy}</div>
                  <div style={{ color: 'var(--accent-emerald)', fontWeight: 600, marginTop: '4px' }}>{ctx.couplingScore}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'docker' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>🐳</span>
              <span>Generated docker-compose.yml for Decomposed Microservices</span>
            </div>
            <button className="btn-primary" onClick={() => handleCopy(dockerCompose, 'docker-compose.yml')}>
              📋 Copy docker-compose.yml
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '14px' }}>
            Production-ready Compose specification provisioning autonomous service containers with isolated PostgreSQL instances and Kafka event broker.
          </p>
          <pre className="code-box" style={{ maxHeight: '480px', color: 'var(--accent-cyan)' }}>
            {dockerCompose}
          </pre>
        </div>
      )}

      {activeTab === 'k8s' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>☸️</span>
              <span>Generated Kubernetes (K8s) Deployment & Service Manifest</span>
            </div>
            <button className="btn-primary" onClick={() => handleCopy(k8sManifest, 'K8s manifest')}>
              📋 Copy K8s Manifest
            </button>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginBottom: '14px' }}>
            Enterprise cloud-native deployment with 3-replica autoscaling, resource constraints, and cluster internal networking.
          </p>
          <pre className="code-box" style={{ maxHeight: '480px', color: 'var(--accent-emerald)' }}>
            {k8sManifest}
          </pre>
        </div>
      )}
    </div>
  );
}
