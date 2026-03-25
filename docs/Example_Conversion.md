# EXAMPLE_CONVERSION.md

# Example Conversion
## Informatica XML → Canonical JSON → Airflow DAG

This document demonstrates how the conversion engine transforms a legacy ETL pipeline definition into a modern pipeline.

---

# Step 1 — Example Informatica XML

Example transformation exported from Informatica PowerCenter.

```
<TRANSFORMATION NAME="JoinOrders" TYPE="JOINER">
  <TRANSFORMFIELD NAME="CUSTOMER_ID"/>
  <TRANSFORMFIELD NAME="ORDER_TOTAL"/>
</TRANSFORMATION>
```

This XML describes a join transformation in the pipeline.

---

# Step 2 — Parsed Metadata

The XML parser extracts structured metadata.

```
{
  "type": "transformation",
  "transformType": "join",
  "name": "JoinOrders",
  "fields": [
    "CUSTOMER_ID",
    "ORDER_TOTAL"
  ]
}
```

---

# Step 3 — Canonical Pipeline Model

Parsed metadata is normalized into the canonical pipeline representation.

```
{
  "pipeline_name": "customer_orders_pipeline",
  "nodes": [
    {
      "id": "src_customers",
      "type": "source"
    },
    {
      "id": "join_orders",
      "type": "join"
    },
    {
      "id": "tgt_orders_dw",
      "type": "target"
    }
  ],
  "edges": [
    {
      "from": "src_customers",
      "to": "join_orders"
    },
    {
      "from": "join_orders",
      "to": "tgt_orders_dw"
    }
  ]
}
```

---

# Step 4 — Generated Airflow DAG

The canonical pipeline is converted into an Airflow DAG.

```
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

with DAG("customer_orders_pipeline", start_date=datetime(2024,1,1)) as dag:

    extract_customers = PythonOperator(
        task_id="extract_customers",
        python_callable=extract_customers_data
    )

    join_orders = PythonOperator(
        task_id="join_orders",
        python_callable=join_customer_orders
    )

    load_dw = PythonOperator(
        task_id="load_dw",
        python_callable=load_orders_dw
    )

    extract_customers >> join_orders >> load_dw
```

---

# Final Output

Pipeline conversion result:

Legacy Informatica Mapping → Canonical JSON Model → Airflow DAG

This demonstrates how the platform automatically translates ETL pipeline definitions into modern orchestration pipelines.