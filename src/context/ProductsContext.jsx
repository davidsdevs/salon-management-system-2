// src/contexts/ProductsContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, doc, onSnapshot, query, where, getDoc } from "firebase/firestore";

const ProductsContext = createContext();

export function useProducts() {
  return useContext(ProductsContext);
}

export function ProductsProvider({ children }) {
  const [mergedProducts, setMergedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeBranch = null;

    async function init() {
      setLoading(true);

      const branchInfo =
        JSON.parse(localStorage.getItem("branchInfo")) ||
        JSON.parse(sessionStorage.getItem("branchInfo"));
      if (!branchInfo?.id) {
        setLoading(false);
        return;
      }

      // Listen to branch_products in real-time for logged-in branch
      const branchQuery = query(
        collection(db, "branch_products"),
        where("branchId", "==", branchInfo.id)
      );

      unsubscribeBranch = onSnapshot(branchQuery, async (branchSnap) => {
        const branchData = branchSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Fetch all master products referenced by branch products
        const masterIds = [...new Set(branchData.map((bp) => bp.productId))];
        const masterDocs = await Promise.all(
          masterIds.map(async (id) => {
            const docRef = doc(db, "master_products", id);
            const snap = await getDoc(docRef);
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
          })
        );
        const masterData = masterDocs.filter(Boolean);

        // Fetch suppliers referenced by master products
        const supplierIds = [...new Set(masterData.map((m) => m.supplier).filter(Boolean))];
        const supplierDocs = await Promise.all(
          supplierIds.map(async (id) => {
            const snap = await getDoc(doc(db, "suppliers", id));
            return snap.exists() ? { id: snap.id, name: snap.data().name } : null;
          })
        );
        const suppliersObj = {};
        supplierDocs.filter(Boolean).forEach((s) => {
          suppliersObj[s.id] = s.name;
        });

        // Merge branch + master + supplier
        const merged = branchData.map((bp) => {
          const master = masterData.find((m) => m.id === bp.productId) || {};
          const supplierName = master.supplier ? suppliersObj[master.supplier] || "N/A" : "N/A";

          return {
            id: bp.id,
            branchProductId: bp.id,
            productId: master.id || "N/A",
            name: master.name || "N/A",
            category: master.category || "N/A",
            productStatus: bp.productStatus || "Inactive",
            supplier: supplierName,
            unitCost: master.unitCost || 0,
            otcPrice: bp.otcPrice || 0,
            sku: master.sku || "N/A",
            status: bp.status || "Inactive",
            shelfLife: master.shelfLife || "",
            imageUrl: master.imageUrl || "",
            description: master.description || "",
            branchId: bp.branchId, // ensure branchId is present for filtering
          };
        });

        setMergedProducts(merged);
        sessionStorage.setItem("mergedProducts", JSON.stringify(merged));
        setLoading(false);
      });
    }

    init();

    return () => {
      if (unsubscribeBranch) unsubscribeBranch();
    };
  }, []);

  const refreshProducts = () => {
    sessionStorage.removeItem("mergedProducts");
    setMergedProducts([]);
    setLoading(true);
    window.location.reload();
  };

  return (
    <ProductsContext.Provider value={{ mergedProducts, loading, refreshProducts }}>
      {children}
    </ProductsContext.Provider>
  );
}
