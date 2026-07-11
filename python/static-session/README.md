# Static Session Demo

Static Sessions are intended for fixed network identity and longer-running compliant tasks.

This example may create a real paid Session. Set `NEXALAYER_PRODUCT_NO` to a static product from `/products?type=static`.

```bash
pip install requests
export NEXALAYER_API_KEY=agk_your_key
export NEXALAYER_PRODUCT_NO=your_static_product_no
python main.py
```

