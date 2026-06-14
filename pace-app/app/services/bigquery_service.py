import logging

logger = logging.getLogger(__name__)


def get_project_list(search: str = "", limit: int = 1000) -> list:
    """
    Fetch project/AFE info from GCP BigQuery.
    Table: pttep-th-corp-datalake.datamart_engineering_master.mpms_project_afe_info
    """
    try:
        from google.cloud import bigquery

        client = bigquery.Client()

        query = """
            SELECT *
            FROM `pttep-th-corp-datalake.datamart_engineering_master.mpms_project_afe_info`
        """
        if search:
            query += """
            WHERE LOWER(CAST(project_no AS STRING)) LIKE LOWER(@search)
               OR LOWER(CAST(project_name AS STRING)) LIKE LOWER(@search)
            """
        query += f" LIMIT {limit}"

        job_config = bigquery.QueryJobConfig()
        if search:
            job_config.query_parameters = [
                bigquery.ScalarQueryParameter("search", "STRING", f"%{search}%")
            ]

        rows = client.query(query, job_config=job_config).result()

        results = []
        for row in rows:
            record = dict(row)
            # Convert non-serializable types to string
            for k, v in record.items():
                if hasattr(v, "isoformat"):
                    record[k] = v.isoformat()
                elif v is not None and not isinstance(v, (str, int, float, bool)):
                    record[k] = str(v)
            results.append(record)

        logger.info(f"BigQuery projects: returned {len(results)} rows")
        return results

    except ImportError:
        logger.warning("google-cloud-bigquery not installed. Returning empty list.")
        return []
    except Exception as e:
        logger.warning(f"BigQuery project list error: {e}")
        return []


def get_notification_list(search: str = "", limit: int = 1000) -> list:
    """
    Fetch notification list from GCP BigQuery.
    Table: pttep-th-corp-datalake.datamart_maintenance_order.notification
    """
    try:
        from google.cloud import bigquery

        client = bigquery.Client()

        query = """
            SELECT *
            FROM `pttep-th-corp-datalake.datamart_maintenance_order.notification`
        """
        if search:
            query += """
            WHERE LOWER(CAST(notification_no AS STRING)) LIKE LOWER(@search)
               OR LOWER(CAST(notification_description AS STRING)) LIKE LOWER(@search)
            """
        query += f" LIMIT {limit}"

        job_config = bigquery.QueryJobConfig()
        if search:
            job_config.query_parameters = [
                bigquery.ScalarQueryParameter("search", "STRING", f"%{search}%")
            ]

        rows = client.query(query, job_config=job_config).result()

        results = []
        for row in rows:
            record = dict(row)
            for k, v in record.items():
                if hasattr(v, "isoformat"):
                    record[k] = v.isoformat()
                elif v is not None and not isinstance(v, (str, int, float, bool)):
                    record[k] = str(v)
            results.append(record)

        logger.info(f"BigQuery notifications: returned {len(results)} rows")
        return results

    except ImportError:
        logger.warning("google-cloud-bigquery not installed. Returning empty list.")
        return []
    except Exception as e:
        logger.warning(f"BigQuery notification list error: {e}")
        return []