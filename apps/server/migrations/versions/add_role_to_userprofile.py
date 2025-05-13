"""add role to userprofile

Revision ID: 02
Revises: 01
Create Date: 2023-09-15 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = '02'
down_revision: Union[str, None] = '01'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Añadir columna role a la tabla user_profiles con valor por defecto 'member'
    op.add_column('user_profiles', sa.Column('role', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='member'))
    
    # Crear índice para búsquedas eficientes por rol
    op.create_index(op.f('ix_user_profiles_role'), 'user_profiles', ['role'], unique=False)


def downgrade() -> None:
    # Eliminar índice
    op.drop_index(op.f('ix_user_profiles_role'), table_name='user_profiles')
    
    # Eliminar columna
    op.drop_column('user_profiles', 'role') 