// src/components/ItemListEditor.jsx
import React, { useState, useEffect } from 'react';

// (Importar constantes y estilos necesarios desde el archivo principal o un archivo común)
import { API_URL } from '../utils/api'

const BASE_URL = API_URL;

const ItemListEditor = ({ items = [], onSave, readOnly = false }) => {
    const [editableItems, setEditableItems] = useState(items);
    const [error, setError] = useState(null);

    useEffect(() => {
        setEditableItems(items);
    }, [items]);

    const handleAddItem = () => {
        setEditableItems([...editableItems, { id: Date.now(), name: '', quantity: 1 }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...editableItems];
        newItems.splice(index, 1);
        setEditableItems(newItems);
        onSave(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...editableItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setEditableItems(newItems);
        onSave(newItems);
    };

    // Estilos
    const styles = {
        container: {
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '20px'
        },
        itemRow: {
            display: 'flex',
            gap: '10px',
            marginBottom: '10px',
            alignItems: 'center'
        },
        input: {
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            flex: 1
        },
        quantityInput: {
            width: '80px',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px'
        },
        button: {
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: '#dc3545',
            color: 'white'
        },
        addButton: {
            backgroundColor: '#28a745',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
        },
        error: {
            color: '#dc3545',
            marginTop: '10px'
        }
    };

    return (
        <div style={styles.container}>
            {editableItems.map((item, index) => (
                <div key={item.id || index} style={styles.itemRow}>
                    <input
                        type="text"
                        value={item.name || ''}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        placeholder="Nombre del artículo"
                        style={styles.input}
                        disabled={readOnly}
                    />
                    <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        min="0"
                        style={styles.quantityInput}
                        disabled={readOnly}
                    />
                    {!readOnly && (
                        <button
                            onClick={() => handleRemoveItem(index)}
                            style={styles.button}
                        >
                            Eliminar
                        </button>
                    )}
                </div>
            ))}
            {!readOnly && (
                <button onClick={handleAddItem} style={styles.addButton}>
                    Agregar Artículo
                </button>
            )}
            {error && <div style={styles.error}>{error}</div>}
        </div>
    );
};

export default ItemListEditor;