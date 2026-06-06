"""add_google_id_and_hard_cutover

Revision ID: 7adaa559ed82
Revises: a1b2c3d4e5f6
Create Date: 2026-06-06 16:54:48.025558

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7adaa559ed82'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DELETE FROM mynab.auth_user")
    op.add_column(
        'auth_user',
        sa.Column('google_id', sa.String(length=255), nullable=True),
        schema='mynab'
    )
    op.create_index(
        'ix_auth_user_google_id', 'auth_user', ['google_id'],
        unique=True, schema='mynab'
    )


def downgrade() -> None:
    op.drop_index('ix_auth_user_google_id', table_name='auth_user', schema='mynab')
    op.drop_column('auth_user', 'google_id', schema='mynab')
