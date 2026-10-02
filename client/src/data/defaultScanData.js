export const defaultScanData = {
  "id": "scan-1790935654138",
  "repoName": "sample-ecommerce",
  "repoPath": "D:\\antigravity\\mini_project\\sample-ecommerce",
  "scannedAt": "2026-10-02T10:07:34.138Z",
  "techStack": {
    "languages": {
      "TypeScript": "89%"
    },
    "frameworks": [],
    "infrastructure": [
      "PostgreSQL Database"
    ],
    "totalFiles": 9,
    "totalLines": 170
  },
  "elements": [
    {
      "id": "architecture.yaml",
      "name": "architecture",
      "path": "architecture.yaml",
      "layer": "general",
      "extension": ".yaml",
      "lineCount": 50,
      "type": "Module"
    },
    {
      "id": "src/application/OrderApplicationService.ts",
      "name": "OrderApplicationService",
      "path": "src/application/OrderApplicationService.ts",
      "layer": "application",
      "extension": ".ts",
      "lineCount": 18,
      "type": "Class"
    },
    {
      "id": "src/domain/OrderService.ts",
      "name": "OrderService",
      "path": "src/domain/OrderService.ts",
      "layer": "domain",
      "extension": ".ts",
      "lineCount": 21,
      "type": "Class"
    },
    {
      "id": "src/domain/PaymentService.ts",
      "name": "PaymentService",
      "path": "src/domain/PaymentService.ts",
      "layer": "domain",
      "extension": ".ts",
      "lineCount": 16,
      "type": "Class"
    },
    {
      "id": "src/domain/UserService.ts",
      "name": "UserService",
      "path": "src/domain/UserService.ts",
      "layer": "domain",
      "extension": ".ts",
      "lineCount": 17,
      "type": "Class"
    },
    {
      "id": "src/infrastructure/DatabaseRepository.ts",
      "name": "DatabaseRepository",
      "path": "src/infrastructure/DatabaseRepository.ts",
      "layer": "infrastructure",
      "extension": ".ts",
      "lineCount": 7,
      "type": "Class"
    },
    {
      "id": "src/infrastructure/InfrastructureConfig.ts",
      "name": "InfrastructureConfig",
      "path": "src/infrastructure/InfrastructureConfig.ts",
      "layer": "infrastructure",
      "extension": ".ts",
      "lineCount": 6,
      "type": "Class"
    },
    {
      "id": "src/presentation/OrderController.ts",
      "name": "OrderController",
      "path": "src/presentation/OrderController.ts",
      "layer": "presentation",
      "extension": ".ts",
      "lineCount": 15,
      "type": "Class"
    },
    {
      "id": "src/presentation/UserController.ts",
      "name": "UserController",
      "path": "src/presentation/UserController.ts",
      "layer": "presentation",
      "extension": ".ts",
      "lineCount": 20,
      "type": "Class"
    }
  ],
  "dependencies": [
    {
      "source": "src/application/OrderApplicationService.ts",
      "target": "src/domain/OrderService.ts",
      "rawImport": "../domain/OrderService",
      "lineNumber": 1,
      "type": "IMPORT"
    },
    {
      "source": "src/application/OrderApplicationService.ts",
      "target": "src/domain/UserService.ts",
      "rawImport": "../domain/UserService",
      "lineNumber": 2,
      "type": "IMPORT"
    },
    {
      "source": "src/domain/OrderService.ts",
      "target": "src/domain/PaymentService.ts",
      "rawImport": "./PaymentService",
      "lineNumber": 2,
      "type": "IMPORT"
    },
    {
      "source": "src/domain/PaymentService.ts",
      "target": "src/domain/OrderService.ts",
      "rawImport": "./OrderService",
      "lineNumber": 2,
      "type": "IMPORT"
    },
    {
      "source": "src/domain/UserService.ts",
      "target": "src/infrastructure/InfrastructureConfig.ts",
      "rawImport": "../infrastructure/InfrastructureConfig",
      "lineNumber": 2,
      "type": "IMPORT"
    },
    {
      "source": "src/presentation/OrderController.ts",
      "target": "src/application/OrderApplicationService.ts",
      "rawImport": "../application/OrderApplicationService",
      "lineNumber": 1,
      "type": "IMPORT"
    },
    {
      "source": "src/presentation/UserController.ts",
      "target": "src/application/OrderApplicationService.ts",
      "rawImport": "../application/OrderApplicationService",
      "lineNumber": 1,
      "type": "IMPORT"
    },
    {
      "source": "src/presentation/UserController.ts",
      "target": "src/infrastructure/DatabaseRepository.ts",
      "rawImport": "../infrastructure/DatabaseRepository",
      "lineNumber": 3,
      "type": "IMPORT"
    }
  ],
  "graph": {
    "nodes": [
      {
        "id": "architecture.yaml",
        "type": "customNode",
        "data": {
          "label": "architecture",
          "layer": "general",
          "type": "Module",
          "path": "architecture.yaml",
          "lineCount": 50
        },
        "position": {
          "x": 180,
          "y": 700
        }
      },
      {
        "id": "src/application/OrderApplicationService.ts",
        "type": "customNode",
        "data": {
          "label": "OrderApplicationService",
          "layer": "application",
          "type": "Class",
          "path": "src/application/OrderApplicationService.ts",
          "lineCount": 18
        },
        "position": {
          "x": 180,
          "y": 240
        }
      },
      {
        "id": "src/domain/OrderService.ts",
        "type": "customNode",
        "data": {
          "label": "OrderService",
          "layer": "domain",
          "type": "Class",
          "path": "src/domain/OrderService.ts",
          "lineCount": 21
        },
        "position": {
          "x": 180,
          "y": 400
        }
      },
      {
        "id": "src/domain/PaymentService.ts",
        "type": "customNode",
        "data": {
          "label": "PaymentService",
          "layer": "domain",
          "type": "Class",
          "path": "src/domain/PaymentService.ts",
          "lineCount": 16
        },
        "position": {
          "x": 440,
          "y": 400
        }
      },
      {
        "id": "src/domain/UserService.ts",
        "type": "customNode",
        "data": {
          "label": "UserService",
          "layer": "domain",
          "type": "Class",
          "path": "src/domain/UserService.ts",
          "lineCount": 17
        },
        "position": {
          "x": 700,
          "y": 400
        }
      },
      {
        "id": "src/infrastructure/DatabaseRepository.ts",
        "type": "customNode",
        "data": {
          "label": "DatabaseRepository",
          "layer": "infrastructure",
          "type": "Class",
          "path": "src/infrastructure/DatabaseRepository.ts",
          "lineCount": 7
        },
        "position": {
          "x": 180,
          "y": 560
        }
      },
      {
        "id": "src/infrastructure/InfrastructureConfig.ts",
        "type": "customNode",
        "data": {
          "label": "InfrastructureConfig",
          "layer": "infrastructure",
          "type": "Class",
          "path": "src/infrastructure/InfrastructureConfig.ts",
          "lineCount": 6
        },
        "position": {
          "x": 440,
          "y": 560
        }
      },
      {
        "id": "src/presentation/OrderController.ts",
        "type": "customNode",
        "data": {
          "label": "OrderController",
          "layer": "presentation",
          "type": "Class",
          "path": "src/presentation/OrderController.ts",
          "lineCount": 15
        },
        "position": {
          "x": 180,
          "y": 80
        }
      },
      {
        "id": "src/presentation/UserController.ts",
        "type": "customNode",
        "data": {
          "label": "UserController",
          "layer": "presentation",
          "type": "Class",
          "path": "src/presentation/UserController.ts",
          "lineCount": 20
        },
        "position": {
          "x": 440,
          "y": 80
        }
      }
    ],
    "edges": [
      {
        "id": "e-1",
        "source": "src/application/OrderApplicationService.ts",
        "target": "src/domain/OrderService.ts",
        "animated": true,
        "style": {
          "stroke": "#38bdf8"
        }
      },
      {
        "id": "e-2",
        "source": "src/application/OrderApplicationService.ts",
        "target": "src/domain/UserService.ts",
        "animated": true,
        "style": {
          "stroke": "#38bdf8"
        }
      },
      {
        "id": "e-3",
        "source": "src/domain/OrderService.ts",
        "target": "src/domain/PaymentService.ts",
        "animated": true,
        "style": {
          "stroke": "#38bdf8"
        }
      },
      {
        "id": "e-4",
        "source": "src/domain/PaymentService.ts",
        "target": "src/domain/OrderService.ts",
        "animated": true,
        "style": {
          "stroke": "#38bdf8"
        }
      },
      {
        "id": "e-5",
        "source": "src/domain/UserService.ts",
        "target": "src/infrastructure/InfrastructureConfig.ts",
        "animated": true,
        "style": {
          "stroke": "#38bdf8"
        }
      },
      {
        "id": "e-6",
        "source": "src/presentation/OrderController.ts",
        "target": "src/application/OrderApplicationService.ts",
        "animated": true,
        "style": {
          "stroke": "#38bdf8"
        }
      },
      {
        "id": "e-7",
        "source": "src/presentation/UserController.ts",
        "target": "src/application/OrderApplicationService.ts",
        "animated": true,
        "style": {
          "stroke": "#38bdf8"
        }
      },
      {
        "id": "e-8",
        "source": "src/presentation/UserController.ts",
        "target": "src/infrastructure/DatabaseRepository.ts",
        "animated": true,
        "style": {
          "stroke": "#38bdf8"
        }
      }
    ]
  },
  "violations": [
    {
      "id": "DRIFT-001",
      "severity": "HIGH",
      "category": "LAYER_VIOLATION",
      "ruleName": "no-ui-database-access",
      "source": "src/presentation/UserController.ts",
      "target": "src/infrastructure/DatabaseRepository.ts",
      "expected": "presentation -> allowed dependencies",
      "actual": "presentation (UserController) -> infrastructure (DatabaseRepository)",
      "evidence": [
        "src/presentation/UserController.ts:3 -> imports '../infrastructure/DatabaseRepository'",
        "Target File: src/infrastructure/DatabaseRepository.ts"
      ],
      "impact": "Bypasses architecture boundary governance. Increases coupling and breaks separation of concerns between presentation and infrastructure.",
      "recommendation": "Remove direct reference from UserController to DatabaseRepository. Introduce a service abstraction or dependency inversion interface."
    },
    {
      "id": "DRIFT-002",
      "severity": "CRITICAL",
      "category": "BOUNDARY_VIOLATION",
      "ruleName": "no-domain-infrastructure-coupling",
      "source": "src/domain/UserService.ts",
      "target": "src/infrastructure/InfrastructureConfig.ts",
      "expected": "domain -> allowed dependencies",
      "actual": "domain (UserService) -> infrastructure (InfrastructureConfig)",
      "evidence": [
        "src/domain/UserService.ts:2 -> imports '../infrastructure/InfrastructureConfig'",
        "Target File: src/infrastructure/InfrastructureConfig.ts"
      ],
      "impact": "Bypasses architecture boundary governance. Increases coupling and breaks separation of concerns between domain and infrastructure.",
      "recommendation": "Remove direct reference from UserService to InfrastructureConfig. Introduce a service abstraction or dependency inversion interface."
    },
    {
      "id": "DRIFT-003",
      "severity": "CRITICAL",
      "category": "CIRCULAR_DEPENDENCY",
      "ruleName": "no-cyclic-dependencies",
      "source": "src/domain/PaymentService.ts",
      "target": "src/domain/OrderService.ts",
      "expected": "Acyclic Directed Dependency Graph (DAG)",
      "actual": "Cycle loop detected: src/domain/PaymentService.ts <-> src/domain/OrderService.ts",
      "evidence": [
        "Cyclic Node: src/domain/PaymentService.ts",
        "Cyclic Node: src/domain/OrderService.ts"
      ],
      "impact": "Prevents independent testing and compilation. Causes memory leaks, recursion stack overflows, and tight architectural coupling.",
      "recommendation": "Break cycle by extracting shared domain models into a common interface module or using asynchronous domain event dispatching."
    }
  ],
  "health": {
    "overallHealth": 81,
    "architectureDebtIndex": 33,
    "metrics": {
      "layerIntegrity": 82,
      "coupling": 83,
      "cohesion": 100,
      "cycleSafety": 75,
      "boundarySafety": 85,
      "dependencyHygiene": 91,
      "driftStability": 65
    },
    "counts": {
      "totalElements": 9,
      "totalDependencies": 8,
      "totalViolations": 3,
      "criticalCount": 2,
      "highCount": 1,
      "mediumCount": 0,
      "lowCount": 0,
      "cycleCount": 1
    }
  },
  "commitHistory": [
    {
      "commit": "c1a90f",
      "date": "2026-09-15",
      "author": "Sarah Lin",
      "health": 96,
      "violations": 0,
      "debt": 0,
      "message": "Initial clean hexagonal domain layout"
    },
    {
      "commit": "b48e21",
      "date": "2026-09-18",
      "author": "Mark Dev",
      "health": 91,
      "violations": 1,
      "debt": 5,
      "message": "Added Order and Payment domain services"
    },
    {
      "commit": "e92f14",
      "date": "2026-09-22",
      "author": "DevOps Bot",
      "health": 84,
      "violations": 2,
      "debt": 15,
      "message": "Refactored UserController and added direct DB queries"
    },
    {
      "commit": "f87a32",
      "date": "2026-09-28",
      "author": "Alex Chen",
      "health": 76,
      "violations": 4,
      "debt": 28,
      "message": "Introduced Payment-Order circular reference"
    }
  ]
};
